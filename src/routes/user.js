const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const HealthProfile = require('../models/HealthProfile');

// @desc    Get all doctors
// @route   GET /api/users/doctors
// @access  Public
router.get('/doctors', async (req, res) => {
  try {
    const { specialization, location, availability } = req.query;
    
    let query = { role: 'doctor', isActive: true };
    
    if (specialization) {
      query['doctorInfo.specialization'] = { $in: [specialization] };
    }
    
    if (location) {
      query['address.city'] = { $regex: location, $options: 'i' };
    }

    const doctors = await User.find(query)
      .select('firstName lastName email profilePicture doctorInfo address')
      .sort({ 'doctorInfo.yearsOfExperience': -1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get doctor by ID
// @route   GET /api/users/doctors/:id
// @access  Public
router.get('/doctors/:id', async (req, res) => {
  try {
    const doctor = await User.findOne({ 
      _id: req.params.id, 
      role: 'doctor', 
      isActive: true 
    }).select('firstName lastName email profilePicture doctorInfo address');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get user health profile
// @route   GET /api/users/health-profile
// @access  Private
router.get('/health-profile', auth.protect, async (req, res) => {
  try {
    let healthProfile = await HealthProfile.findOne({ user: req.user.id });

    // Create health profile if it doesn't exist
    if (!healthProfile) {
      healthProfile = await HealthProfile.create({ user: req.user.id });
    }

    res.status(200).json({
      success: true,
      healthProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update user health profile
// @route   PUT /api/users/health-profile
// @access  Private
router.put('/health-profile', [
  auth.protect,
  body('medicalHistory').optional().isArray(),
  body('allergies').optional().isArray(),
  body('vitalSigns').optional().isObject(),
  body('lifestyle').optional().isObject(),
  body('familyHistory').optional().isArray()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const allowedUpdates = [
      'medicalHistory', 'allergies', 'vitalSigns', 'lifestyle',
      'familyHistory', 'immunizations', 'screenings', 'healthGoals',
      'riskFactors', 'privacy'
    ];

    let healthProfile = await HealthProfile.findOne({ user: req.user.id });

    if (!healthProfile) {
      healthProfile = await HealthProfile.create({ 
        user: req.user.id,
        ...req.body 
      });
    } else {
      // Update only allowed fields
      const updates = {};
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      healthProfile = await HealthProfile.findByIdAndUpdate(
        healthProfile._id,
        updates,
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      healthProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
router.get('/dashboard', auth.protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const healthProfile = await HealthProfile.findOne({ user: req.user.id });

    // Calculate basic stats
    const dashboardData = {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin
      },
      health: {
        hasProfile: !!healthProfile,
        lastUpdated: healthProfile ? healthProfile.updatedAt : null,
        // Add more health stats here
      },
      // Add more dashboard metrics based on user role
    };

    res.status(200).json({
      success: true,
      dashboard: dashboardData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
router.get('/notifications', auth.protect, async (req, res) => {
  try {
    // This would typically come from a notifications collection
    // For now, return empty array
    const notifications = [];

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get user's doctors
// @route   GET /api/users/my-doctors
// @access  Private
router.get('/my-doctors', auth.protect, async (req, res) => {
  try {
    // This would typically find doctors the user has consultations with
    // For now, return empty array
    const doctors = [];

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Search users (for admin/doctor use)
// @route   GET /api/users/search
// @access  Private (Admin/Doctor only)
router.get('/search', [auth.protect, auth.authorize('admin', 'doctor')], async (req, res) => {
  try {
    const { q, role, limit = 10 } = req.query;
    
    let query = { isActive: true };
    
    if (q) {
      query.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('firstName lastName email role profilePicture isActive')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get user stats (for admin dashboard)
// @route   GET /api/users/stats
// @access  Private (Admin only)
router.get('/stats', [auth.protect, auth.authorize('admin')], async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalPatients = await User.countDocuments({ role: 'patient', isActive: true });
    const totalDoctors = await User.countDocuments({ role: 'doctor', isActive: true });
    const newUsersThisMonth = await User.countDocuments({
      isActive: true,
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalPatients,
        totalDoctors,
        newUsersThisMonth
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

module.exports = router;
