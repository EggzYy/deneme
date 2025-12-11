const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const Medication = require('../models/Medication');
const UserMedication = require('../models/UserMedication');

// @desc    Search medications
// @route   GET /api/medications/search
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const medications = await Medication.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { genericName: { $regex: q, $options: 'i' } },
        { brandName: { $elemMatch: { $regex: q, $options: 'i' } } }
      ]
    })
    .select('name genericName brandName dosage drugClass indications')
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: medications.length,
      medications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get medication by ID
// @route   GET /api/medications/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    res.status(200).json({
      success: true,
      medication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get user's medications
// @route   GET /api/medications/my-medications
// @access  Private
router.get('/my-medications', auth.protect, async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    
    let query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const userMedications = await UserMedication.find(query)
      .populate('medication')
      .populate('prescribedBy', 'firstName lastName')
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserMedication.countDocuments(query);

    res.status(200).json({
      success: true,
      count: userMedications.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      medications: userMedications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Add medication to user's profile
// @route   POST /api/medications/my-medications
// @access  Private
router.post('/my-medications', [
  auth.protect,
  body('medicationId').isMongoId().withMessage('Valid medication ID is required'),
  body('prescribedDosage.amount').isNumeric().withMessage('Valid dosage amount is required'),
  body('prescribedDosage.unit').notEmpty().withMessage('Dosage unit is required'),
  body('prescribedDosage.frequency').notEmpty().withMessage('Frequency is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required')
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

    const { 
      medicationId, 
      prescribedDosage, 
      startDate, 
      endDate, 
      instructions,
      prescribedBy,
      consultation,
      pharmacy
    } = req.body;

    // Verify medication exists
    const medication = await Medication.findById(medicationId);
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Check if user already has this medication
    const existingMedication = await UserMedication.findOne({
      user: req.user.id,
      medication: medicationId,
      status: 'active'
    });

    if (existingMedication) {
      return res.status(400).json({
        success: false,
        message: 'You are already taking this medication'
      });
    }

    const userMedication = await UserMedication.create({
      user: req.user.id,
      medication: medicationId,
      prescribedBy: prescribedBy || null,
      consultation: consultation || null,
      prescribedDosage,
      startDate,
      endDate,
      instructions,
      pharmacy
    });

    await userMedication.populate('medication');

    res.status(201).json({
      success: true,
      medication: userMedication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update user's medication
// @route   PUT /api/medications/my-medications/:id
// @access  Private
router.put('/my-medications/:id', [
  auth.protect,
  body('prescribedDosage').optional().isObject(),
  body('status').optional().isIn(['active', 'completed', 'discontinued', 'paused']),
  body('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const userMedication = await UserMedication.findById(req.params.id);

    if (!userMedication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Check ownership
    if (userMedication.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this medication'
      });
    }

    const allowedUpdates = [
      'prescribedDosage', 'startDate', 'endDate', 'instructions',
      'status', 'pharmacy', 'refillsRemaining'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedMedication = await UserMedication.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('medication')
     .populate('prescribedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      medication: updatedMedication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Record medication intake
// @route   POST /api/medications/my-medications/:id/intake
// @access  Private
router.post('/my-medications/:id/intake', [
  auth.protect,
  body('taken').isBoolean().withMessage('Taken status is required'),
  body('takenAt').optional().isISO8601(),
  body('notes').optional().isString()
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

    const userMedication = await UserMedication.findById(req.params.id);

    if (!userMedication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Check ownership
    if (userMedication.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to record intake for this medication'
      });
    }

    const { taken, takenAt, notes } = req.body;
    const intakeTime = takenAt ? new Date(takenAt) : new Date();

    // Update adherence
    userMedication.updateAdherence(taken, true);
    await userMedication.save();

    // You could also create a HealthData entry for medication intake
    // This would provide better tracking and analytics

    res.status(200).json({
      success: true,
      message: `Medication ${taken ? 'taken' : 'missed'} successfully`,
      medication: {
        id: userMedication._id,
        adherenceRate: userMedication.adherence.adherenceRate,
        lastTaken: userMedication.adherence.lastTaken,
        complianceStatus: userMedication.complianceStatus
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

// @desc    Get medication adherence report
// @route   GET /api/medications/my-medications/:id/adherence
// @access  Private
router.get('/my-medications/:id/adherence', auth.protect, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const userMedication = await UserMedication.findById(req.params.id);

    if (!userMedication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Check ownership
    if (userMedication.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this medication'
      });
    }

    // Calculate period
    let daysBack = 30;
    if (period === '7d') daysBack = 7;
    else if (period === '90d') daysBack = 90;
    else if (period === '1y') daysBack = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get adherence data
    const adherenceData = {
      currentStreak: 0, // This would require more detailed intake tracking
      adherenceRate: userMedication.adherence.adherenceRate,
      totalScheduled: userMedication.adherence.totalScheduled,
      takenCorrectly: userMedication.adherence.takenCorrectly,
      missed: userMedication.adherence.missed,
      takenIncorrectly: userMedication.adherence.takenIncorrectly,
      lastTaken: userMedication.adherence.lastTaken,
      complianceStatus: userMedication.complianceStatus,
      period,
      daysAnalyzed: daysBack
    };

    // Add AI insights if available
    if (userMedication.aiInsights && userMedication.aiInsights.length > 0) {
      adherenceData.aiInsights = userMedication.aiInsights.slice(-5); // Latest 5 insights
    }

    res.status(200).json({
      success: true,
      adherence: adherenceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get medication interactions
// @route   GET /api/medications/:id/interactions
// @access  Private
router.get('/:id/interactions', auth.protect, async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Get user's current medications
    const userMedications = await UserMedication.find({
      user: req.user.id,
      status: 'active'
    }).populate('medication');

    const interactions = [];

    // Check interactions with user's medications
    medication.interactions.forEach(interaction => {
      const hasConflict = userMedications.some(userMed => 
        userMed.medication.name.toLowerCase().includes(interaction.drugName.toLowerCase()) ||
        interaction.drugName.toLowerCase().includes(userMed.medication.name.toLowerCase())
      );

      if (hasConflict) {
        interactions.push({
          medication: medication.name,
          interactingDrug: interaction.drugName,
          type: interaction.interactionType,
          description: interaction.description,
          clinicalEffect: interaction.clinicalEffect
        });
      }
    });

    res.status(200).json({
      success: true,
      interactions,
      count: interactions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get medication reminders
// @route   GET /api/medications/reminders
// @access  Private
router.get('/reminders', auth.protect, async (req, res) => {
  try {
    const activeMedications = await UserMedication.find({
      user: req.user.id,
      status: 'active',
      'reminders.enabled': true
    }).populate('medication', 'name');

    const reminders = [];

    activeMedications.forEach(userMed => {
      userMed.reminders.times.forEach(time => {
        reminders.push({
          medicationId: userMed._id,
          medicationName: userMed.medication.name,
          time: time.time,
          label: time.label,
          frequency: userMed.prescribedDosage.frequency,
          dosage: userMed.prescribedDosage
        });
      });
    });

    res.status(200).json({
      success: true,
      reminders,
      count: reminders.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update medication reminders
// @route   PUT /api/medications/my-medications/:id/reminders
// @access  Private
router.put('/my-medications/:id/reminders', [
  auth.protect,
  body('enabled').isBoolean(),
  body('times').optional().isArray(),
  body('methods').optional().isArray()
], async (req, res) => {
  try {
    const userMedication = await UserMedication.findById(req.params.id);

    if (!userMedication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Check ownership
    if (userMedication.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this medication'
      });
    }

    const updates = {
      'reminders.enabled': req.body.enabled,
      ...req.body.times && { 'reminders.times': req.body.times },
      ...req.body.methods && { 'reminders.methods': req.body.methods }
    };

    const updatedMedication = await UserMedication.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('medication');

    res.status(200).json({
      success: true,
      medication: updatedMedication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete user's medication
// @route   DELETE /api/medications/my-medications/:id
// @access  Private
router.delete('/my-medications/:id', auth.protect, async (req, res) => {
  try {
    const userMedication = await UserMedication.findById(req.params.id);

    if (!userMedication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Check ownership
    if (userMedication.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this medication'
      });
    }

    await userMedication.remove();

    res.status(200).json({
      success: true,
      message: 'Medication removed successfully'
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
