const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const Consultation = require('../models/Consultation');
const User = require('../models/User');

// @desc    Create consultation request
// @route   POST /api/consultations
// @access  Private (Patients only)
router.post('/', [
  auth.protect,
  auth.requirePatient,
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
  body('type').isIn(['video', 'audio', 'chat', 'in-person']).withMessage('Invalid consultation type'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('chiefComplaint').notEmpty().withMessage('Chief complaint is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { doctorId, type, scheduledDate, duration, chiefComplaint, symptoms } = req.body;

    // Verify doctor exists and is active
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Create consultation
    const consultation = await Consultation.create({
      patient: req.user.id,
      doctor: doctorId,
      type,
      scheduledDate,
      duration: duration || 30,
      chiefComplaint,
      symptoms: symptoms || [],
      status: 'scheduled'
    });

    await consultation.populate('doctor', 'firstName lastName profilePicture doctorInfo');

    res.status(201).json({
      success: true,
      consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get user's consultations
// @route   GET /api/consultations
// @access  Private
router.get('/', auth.protect, async (req, res) => {
  try {
    const { status, type, limit = 20, page = 1 } = req.query;
    
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user.id;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const consultations = await Consultation.find(query)
      .populate('patient', 'firstName lastName profilePicture')
      .populate('doctor', 'firstName lastName profilePicture doctorInfo')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Consultation.countDocuments(query);

    res.status(200).json({
      success: true,
      count: consultations.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      consultations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get consultation by ID
// @route   GET /api/consultations/:id
// @access  Private
router.get('/:id', auth.protect, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('patient', 'firstName lastName profilePicture email phone')
      .populate('doctor', 'firstName lastName profilePicture doctorInfo');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check authorization
    const isAuthorized = consultation.patient._id.toString() === req.user.id ||
                        consultation.doctor._id.toString() === req.user.id ||
                        req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this consultation'
      });
    }

    res.status(200).json({
      success: true,
      consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update consultation
// @route   PUT /api/consultations/:id
// @access  Private
router.put('/:id', [
  auth.protect,
  body('status').optional().isIn(['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show']),
  body('diagnosis').optional().isString(),
  body('treatmentPlan').optional().isString(),
  body('followUpInstructions').optional().isString()
], async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check authorization
    const isDoctor = consultation.doctor.toString() === req.user.id;
    const isPatient = consultation.patient.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isDoctor && !isPatient && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this consultation'
      });
    }

    const allowedUpdates = [];
    
    // Patient can update limited fields
    if (isPatient) {
      allowedUpdates.push('symptoms', 'chiefComplaint');
    }
    
    // Doctor can update medical fields
    if (isDoctor) {
      allowedUpdates.push(
        'status', 'diagnosis', 'differentialDiagnosis', 'clinicalFindings',
        'treatmentPlan', 'followUpInstructions', 'prescriptions', 'labOrders',
        'referrals', 'doctorNotes', 'actualDuration'
      );
    }

    // Admin can update any field
    if (isAdmin) {
      allowedUpdates.push(
        'status', 'scheduledDate', 'duration', 'meetingId', 'meetingUrl',
        'diagnosis', 'treatmentPlan', 'prescriptions', 'labOrders'
      );
    }

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedConsultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('patient', 'firstName lastName profilePicture')
     .populate('doctor', 'firstName lastName profilePicture doctorInfo');

    res.status(200).json({
      success: true,
      consultation: updatedConsultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Start consultation (for real-time features)
// @route   POST /api/consultations/:id/start
// @access  Private (Doctor only)
router.post('/:id/start', [auth.protect, auth.requireDoctor], async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    if (consultation.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start this consultation'
      });
    }

    consultation.status = 'in-progress';
    consultation.actualDuration = 0;
    await consultation.save();

    // Generate meeting room token (in a real app, integrate with video service)
    const roomToken = `room_${consultation._id}_${Date.now()}`;

    res.status(200).json({
      success: true,
      consultation,
      roomToken
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    End consultation
// @route   POST /api/consultations/:id/end
// @access  Private (Doctor only)
router.post('/:id/end', [auth.protect, auth.requireDoctor], async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    if (consultation.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end this consultation'
      });
    }

    consultation.status = 'completed';
    if (consultation.actualDuration === 0) {
      // Calculate actual duration from scheduled time
      const now = new Date();
      const scheduledTime = consultation.scheduledDate;
      consultation.actualDuration = Math.round((now - scheduledTime) / (1000 * 60)); // minutes
    }
    
    await consultation.save();

    res.status(200).json({
      success: true,
      consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Rate consultation
// @route   POST /api/consultations/:id/rate
// @access  Private (Patient only)
router.post('/:id/rate', [
  auth.protect,
  auth.requirePatient,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    if (consultation.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to rate this consultation'
      });
    }

    if (consultation.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed consultations'
      });
    }

    consultation.patientRating = req.body.rating;
    consultation.patientFeedback = req.body.feedback || '';
    await consultation.save();

    res.status(200).json({
      success: true,
      message: 'Consultation rated successfully',
      consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get doctor's consultations for dashboard
// @route   GET /api/consultations/doctor/dashboard
// @access  Private (Doctor only)
router.get('/doctor/dashboard', [auth.protect, auth.requireDoctor], async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's consultations
    const todayConsultations = await Consultation.find({
      doctor: req.user.id,
      scheduledDate: { $gte: today, $lt: tomorrow }
    }).populate('patient', 'firstName lastName profilePicture');

    // Upcoming consultations
    const upcomingConsultations = await Consultation.find({
      doctor: req.user.id,
      scheduledDate: { $gt: new Date() },
      status: 'scheduled'
    }).populate('patient', 'firstName lastName profilePicture')
      .sort({ scheduledDate: 1 })
      .limit(5);

    // Recent consultations
    const recentConsultations = await Consultation.find({
      doctor: req.user.id,
      status: 'completed'
    }).populate('patient', 'firstName lastName profilePicture')
      .sort({ updatedAt: -1 })
      .limit(5);

    // Stats
    const stats = {
      todayCount: todayConsultations.length,
      upcomingCount: upcomingConsultations.length,
      thisWeekCount: await Consultation.countDocuments({
        doctor: req.user.id,
        scheduledDate: {
          $gte: today,
          $lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      }),
      totalConsultations: await Consultation.countDocuments({ doctor: req.user.id }),
      averageRating: await Consultation.aggregate([
        { $match: { doctor: req.user.id, patientRating: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$patientRating' } } }
      ])
    };

    res.status(200).json({
      success: true,
      dashboard: {
        todayConsultations,
        upcomingConsultations,
        recentConsultations,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Cancel consultation
// @route   PUT /api/consultations/:id/cancel
// @access  Private
router.put('/:id/cancel', auth.protect, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check authorization
    const isDoctor = consultation.doctor.toString() === req.user.id;
    const isPatient = consultation.patient.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isDoctor && !isPatient && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this consultation'
      });
    }

    consultation.status = 'cancelled';
    await consultation.save();

    res.status(200).json({
      success: true,
      message: 'Consultation cancelled successfully',
      consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
