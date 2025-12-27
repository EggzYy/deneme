const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const HealthProfile = require('../models/HealthProfile');
const HealthData = require('../models/HealthData');

const mapLifestyleToClient = (lifestyle = {}) => {
  const smokingStatus = lifestyle.smoking?.status || 'never';

  const alcoholMap = {
    never: 'none',
    rarely: 'occasional',
    socially: 'moderate',
    regularly: 'moderate',
    heavily: 'heavy'
  };

  const exerciseMap = {
    never: 'sedentary',
    rarely: 'light',
    '1-2-times-week': 'light',
    '3-4-times-week': 'moderate',
    daily: 'active'
  };

  const dietMap = {
    regular: 'balanced',
    vegetarian: 'vegetarian',
    vegan: 'vegan',
    keto: 'keto',
    paleo: 'other',
    mediterranean: 'mediterranean',
    other: 'other'
  };

  return {
    smokingStatus,
    alcoholConsumption: alcoholMap[lifestyle.alcohol?.consumption] || 'none',
    exerciseFrequency: exerciseMap[lifestyle.exercise?.frequency] || 'moderate',
    dietType: dietMap[lifestyle.diet?.type] || 'balanced',
    sleepHours: lifestyle.sleep?.hoursPerNight ?? 7
  };
};

const applyClientLifestyle = (healthProfile, clientLifestyle = {}) => {
  const alcoholMap = {
    none: 'never',
    occasional: 'rarely',
    moderate: 'regularly',
    heavy: 'heavily'
  };

  const exerciseMap = {
    sedentary: 'never',
    light: '1-2-times-week',
    moderate: '3-4-times-week',
    active: 'daily'
  };

  const dietMap = {
    balanced: 'regular',
    vegetarian: 'vegetarian',
    vegan: 'vegan',
    keto: 'keto',
    mediterranean: 'mediterranean',
    other: 'other'
  };

  if (!healthProfile.lifestyle) healthProfile.lifestyle = {};
  if (!healthProfile.lifestyle.smoking) healthProfile.lifestyle.smoking = {};
  if (!healthProfile.lifestyle.alcohol) healthProfile.lifestyle.alcohol = {};
  if (!healthProfile.lifestyle.exercise) healthProfile.lifestyle.exercise = {};
  if (!healthProfile.lifestyle.diet) healthProfile.lifestyle.diet = {};
  if (!healthProfile.lifestyle.sleep) healthProfile.lifestyle.sleep = {};

  if (clientLifestyle.smokingStatus) {
    healthProfile.lifestyle.smoking.status = clientLifestyle.smokingStatus;
  }

  if (clientLifestyle.alcoholConsumption) {
    healthProfile.lifestyle.alcohol.consumption = alcoholMap[clientLifestyle.alcoholConsumption] || 'never';
  }

  if (clientLifestyle.exerciseFrequency) {
    healthProfile.lifestyle.exercise.frequency = exerciseMap[clientLifestyle.exerciseFrequency] || 'never';
  }

  if (clientLifestyle.dietType) {
    healthProfile.lifestyle.diet.type = dietMap[clientLifestyle.dietType] || 'regular';
  }

  if (clientLifestyle.sleepHours !== undefined) {
    const hours = Number(clientLifestyle.sleepHours);
    if (!Number.isNaN(hours)) {
      healthProfile.lifestyle.sleep.hoursPerNight = hours;
    }
  }
};

const toClientProfile = (healthProfile) => {
  const currentConditions = (healthProfile.medicalHistory || [])
    .filter((m) => ['active', 'in-treatment'].includes(m.status))
    .map((m) => m.condition)
    .filter(Boolean);

  return {
    _id: healthProfile._id,
    bloodType: healthProfile.bloodType || '',
    height: healthProfile.vitalSigns?.height?.value ?? '',
    weight: healthProfile.vitalSigns?.weight?.value ?? '',
    allergies: (healthProfile.allergies || []).map((a) => ({
      name: a.allergen,
      severity: a.severity
    })),
    currentConditions,
    lifestyle: mapLifestyleToClient(healthProfile.lifestyle)
  };
};

// @desc    Get user's simplified health profile (for Profile page)
// @route   GET /api/health/profile
// @access  Private
router.get('/profile', auth.protect, async (req, res) => {
  try {
    let healthProfile = await HealthProfile.findOne({ user: req.user.id });

    if (!healthProfile) {
      healthProfile = await HealthProfile.create({ user: req.user.id });
    }

    res.status(200).json({
      success: true,
      profile: toClientProfile(healthProfile)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

const profileValidators = [
  auth.protect,
  body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('height').optional().isNumeric(),
  body('weight').optional().isNumeric(),
  body('allergies').optional().isArray(),
  body('currentConditions').optional().isArray(),
  body('lifestyle').optional().isObject()
];

const upsertProfileHandler = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let healthProfile = await HealthProfile.findOne({ user: req.user.id });

    if (!healthProfile) {
      healthProfile = await HealthProfile.create({ user: req.user.id });
    }

    const { bloodType, height, weight, allergies, currentConditions, lifestyle } = req.body;

    if (bloodType !== undefined) {
      healthProfile.bloodType = bloodType;
    }

    if (height !== undefined) {
      const value = Number(height);
      if (!Number.isNaN(value)) {
        if (!healthProfile.vitalSigns) healthProfile.vitalSigns = {};
        healthProfile.vitalSigns.height = { value, unit: 'cm' };
      }
    }

    if (weight !== undefined) {
      const value = Number(weight);
      if (!Number.isNaN(value)) {
        if (!healthProfile.vitalSigns) healthProfile.vitalSigns = {};
        healthProfile.vitalSigns.weight = { value, unit: 'kg', recordedAt: new Date() };
      }
    }

    if (Array.isArray(allergies)) {
      healthProfile.allergies = allergies
        .map((a) => ({
          allergen: a.allergen || a.name,
          severity: a.severity || 'moderate'
        }))
        .filter((a) => a.allergen);
    }

    if (Array.isArray(currentConditions)) {
      const preserved = (healthProfile.medicalHistory || []).filter(
        (m) => !['active', 'in-treatment'].includes(m.status)
      );

      const next = currentConditions
        .map((c) => String(c).trim())
        .filter(Boolean)
        .map((condition) => ({ condition, status: 'active' }));

      healthProfile.medicalHistory = [...preserved, ...next];
    }

    if (lifestyle && typeof lifestyle === 'object') {
      applyClientLifestyle(healthProfile, lifestyle);
    }

    await healthProfile.save();

    res.status(200).json({
      success: true,
      profile: toClientProfile(healthProfile)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create user's simplified health profile
// @route   POST /api/health/profile
// @access  Private
router.post('/profile', profileValidators, upsertProfileHandler);

// @desc    Update user's simplified health profile
// @route   PUT /api/health/profile
// @access  Private
router.put('/profile', profileValidators, upsertProfileHandler);

// @desc    Add health data entry
// @route   POST /api/health/data
// @access  Private
router.post('/data', [
  auth.protect,
  body('dataType').isIn([
    'vital-signs', 'symptoms', 'activity', 'sleep', 'nutrition',
    'medication-intake', 'lab-results', 'mental-health', 'exercise',
    'heart-rate', 'blood-pressure', 'weight', 'glucose', 'oxygen-saturation',
    'temperature', 'mood', 'stress-level'
  ]).withMessage('Invalid data type'),
  body('source').optional().isIn(['manual', 'wearable', 'iot-device', 'lab-test', 'doctor-input', 'ai-detection']),
  body('recordedAt').optional().isISO8601().withMessage('Invalid date format')
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

    const healthData = await HealthData.create({
      user: req.user.id,
      ...req.body
    });

    res.status(201).json({
      success: true,
      healthData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get user's health data
// @route   GET /api/health/data
// @access  Private
router.get('/data', auth.protect, async (req, res) => {
  try {
    const { 
      dataType, 
      startDate, 
      endDate, 
      source, 
      limit = 100, 
      page = 1 
    } = req.query;
    
    let query = { user: req.user.id };
    
    if (dataType) {
      query.dataType = dataType;
    }
    
    if (source) {
      query.source = source;
    }
    
    if (startDate || endDate) {
      query.recordedAt = {};
      if (startDate) query.recordedAt.$gte = new Date(startDate);
      if (endDate) query.recordedAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const healthData = await HealthData.find(query)
      .sort({ recordedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HealthData.countDocuments(query);

    res.status(200).json({
      success: true,
      count: healthData.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: healthData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get specific health data entry
// @route   GET /api/health/data/:id
// @access  Private
router.get('/data/:id', auth.protect, async (req, res) => {
  try {
    const healthData = await HealthData.findById(req.params.id);

    if (!healthData) {
      return res.status(404).json({
        success: false,
        message: 'Health data not found'
      });
    }

    // Check ownership
    if (healthData.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this data'
      });
    }

    res.status(200).json({
      success: true,
      data: healthData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update health data entry
// @route   PUT /api/health/data/:id
// @access  Private
router.put('/data/:id', [
  auth.protect,
  body('dataType').optional().isIn([
    'vital-signs', 'symptoms', 'activity', 'sleep', 'nutrition',
    'medication-intake', 'lab-results', 'mental-health', 'exercise',
    'heart-rate', 'blood-pressure', 'weight', 'glucose', 'oxygen-saturation',
    'temperature', 'mood', 'stress-level'
  ])
], async (req, res) => {
  try {
    const healthData = await HealthData.findById(req.params.id);

    if (!healthData) {
      return res.status(404).json({
        success: false,
        message: 'Health data not found'
      });
    }

    // Check ownership
    if (healthData.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this data'
      });
    }

    const allowedUpdates = [
      'vitalSigns', 'measurements', 'glucose', 'activity', 'sleep',
      'mentalHealth', 'symptoms', 'nutrition', 'medicationIntake',
      'environment', 'location', 'userNotes', 'context'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedData = await HealthData.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Delete health data entry
// @route   DELETE /api/health/data/:id
// @access  Private
router.delete('/data/:id', auth.protect, async (req, res) => {
  try {
    const healthData = await HealthData.findById(req.params.id);

    if (!healthData) {
      return res.status(404).json({
        success: false,
        message: 'Health data not found'
      });
    }

    // Check ownership
    if (healthData.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this data'
      });
    }

    await healthData.remove();

    res.status(200).json({
      success: true,
      message: 'Health data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get health trends
// @route   GET /api/health/trends
// @access  Private
router.get('/trends', auth.protect, async (req, res) => {
  try {
    const { metric, period = '30d' } = req.query;
    
    let daysBack = 30;
    if (period === '7d') daysBack = 7;
    else if (period === '90d') daysBack = 90;
    else if (period === '1y') daysBack = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    let query = {
      user: req.user.id,
      recordedAt: { $gte: startDate }
    };

    // Add specific metric filtering
    if (metric) {
      switch (metric) {
        case 'heart-rate':
          query['vitalSigns.heartRate.value'] = { $exists: true, $ne: null };
          break;
        case 'blood-pressure':
          query['vitalSigns.bloodPressure.systolic'] = { $exists: true, $ne: null };
          break;
        case 'weight':
          query['measurements.weight.value'] = { $exists: true, $ne: null };
          break;
        case 'glucose':
          query['glucose.value'] = { $exists: true, $ne: null };
          break;
        default:
          break;
      }
    }

    const trendData = await HealthData.find(query)
      .sort({ recordedAt: 1 })
      .select('recordedAt vitalSigns measurements glucose activity sleep mentalHealth');

    // Process and aggregate data
    const trends = {
      heartRate: [],
      bloodPressure: [],
      weight: [],
      glucose: [],
      sleep: [],
      mood: []
    };

    trendData.forEach(entry => {
      if (entry.vitalSigns?.heartRate?.value) {
        trends.heartRate.push({
          date: entry.recordedAt,
          value: entry.vitalSigns.heartRate.value
        });
      }

      if (entry.vitalSigns?.bloodPressure) {
        trends.bloodPressure.push({
          date: entry.recordedAt,
          systolic: entry.vitalSigns.bloodPressure.systolic,
          diastolic: entry.vitalSigns.bloodPressure.diastolic
        });
      }

      if (entry.measurements?.weight?.value) {
        trends.weight.push({
          date: entry.recordedAt,
          value: entry.measurements.weight.value
        });
      }

      if (entry.glucose?.value) {
        trends.glucose.push({
          date: entry.recordedAt,
          value: entry.glucose.value
        });
      }

      if (entry.sleep?.duration) {
        trends.sleep.push({
          date: entry.recordedAt,
          duration: entry.sleep.duration
        });
      }

      if (entry.mentalHealth?.mood?.score) {
        trends.mood.push({
          date: entry.recordedAt,
          score: entry.mentalHealth.mood.score
        });
      }
    });

    res.status(200).json({
      success: true,
      trends,
      period,
      dataPoints: trendData.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get health insights
// @route   GET /api/health/insights
// @access  Private
router.get('/insights', auth.protect, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentData = await HealthData.find({
      user: req.user.id,
      recordedAt: { $gte: thirtyDaysAgo }
    });

    // Simple insights based on recent data
    const insights = [];

    // Heart rate insights
    const heartRates = recentData
      .filter(d => d.vitalSigns?.heartRate?.value)
      .map(d => d.vitalSigns.heartRate.value);
    
    if (heartRates.length > 0) {
      const avgHR = heartRates.reduce((a, b) => a + b) / heartRates.length;
      if (avgHR > 100) {
        insights.push({
          type: 'heart-rate',
          severity: 'warning',
          message: 'Your resting heart rate has been elevated recently. Consider consulting your doctor.',
          data: { average: Math.round(avgHR) }
        });
      }
    }

    // Sleep insights
    const sleepData = recentData
      .filter(d => d.sleep?.duration)
      .map(d => d.sleep.duration);
    
    if (sleepData.length > 0) {
      const avgSleep = sleepData.reduce((a, b) => a + b) / sleepData.length;
      if (avgSleep < 7 * 60) { // Less than 7 hours
        insights.push({
          type: 'sleep',
          severity: 'info',
          message: 'Your average sleep duration is below the recommended 7-9 hours.',
          data: { average: Math.round(avgSleep / 60 * 10) / 10 }
        });
      }
    }

    // Weight trend insights (if available)
    const weights = recentData
      .filter(d => d.measurements?.weight?.value)
      .map(d => ({ date: d.recordedAt, weight: d.measurements.weight.value }));
    
    if (weights.length >= 2) {
      const recent = weights[weights.length - 1].weight;
      const older = weights[0].weight;
      const change = recent - older;
      
      if (Math.abs(change) > 5) { // More than 5kg change
        insights.push({
          type: 'weight',
          severity: Math.abs(change) > 10 ? 'warning' : 'info',
          message: `Your weight has changed significantly (${change > 0 ? 'gained' : 'lost'} ${Math.abs(Math.round(change))}kg) over the past month.`,
          data: { change: Math.round(change) }
        });
      }
    }

    res.status(200).json({
      success: true,
      insights,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Export user's health data
// @route   GET /api/health/export
// @access  Private
router.get('/export', auth.protect, async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, dataType } = req.query;

    const query = { user: req.user.id };

    if (dataType) {
      query.dataType = dataType;
    }

    if (startDate || endDate) {
      query.recordedAt = {};
      if (startDate) query.recordedAt.$gte = new Date(startDate);
      if (endDate) query.recordedAt.$lte = new Date(endDate);
    }

    const healthData = await HealthData.find(query).sort({ recordedAt: 1 });

    if (format === 'json') {
      const payload = JSON.stringify(
        {
          exportedAt: new Date(),
          count: healthData.length,
          data: healthData
        },
        null,
        2
      );

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="health-data.json"');
      return res.status(200).send(payload);
    }

    const csvEscape = (value) => {
      if (value === undefined || value === null) return '';
      const str = String(value);
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'recordedAt',
      'dataType',
      'source',
      'heartRateBpm',
      'systolic',
      'diastolic',
      'weight',
      'weightUnit',
      'glucose',
      'glucoseUnit',
      'sleepMinutes',
      'moodScore',
      'userNotes'
    ];

    const rows = healthData.map((entry) => {
      const heartRate = entry.vitalSigns?.heartRate?.value ?? '';
      const systolic = entry.vitalSigns?.bloodPressure?.systolic ?? '';
      const diastolic = entry.vitalSigns?.bloodPressure?.diastolic ?? '';
      const weight = entry.measurements?.weight?.value ?? '';
      const weightUnit = entry.measurements?.weight?.unit ?? '';
      const glucose = entry.glucose?.value ?? '';
      const glucoseUnit = entry.glucose?.unit ?? '';
      const sleepMinutes = entry.sleep?.duration ?? '';
      const moodScore = entry.mentalHealth?.mood?.score ?? '';

      return [
        entry.recordedAt?.toISOString?.() ? entry.recordedAt.toISOString() : entry.recordedAt,
        entry.dataType,
        entry.source,
        heartRate,
        systolic,
        diastolic,
        weight,
        weightUnit,
        glucose,
        glucoseUnit,
        sleepMinutes,
        moodScore,
        entry.userNotes || ''
      ]
        .map(csvEscape)
        .join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="health-data.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Add symptom checker result
// @route   POST /api/health/symptom-checker
// @access  Private
router.post('/symptom-checker', [
  auth.protect,
  body('symptoms').isArray({ min: 1 }).withMessage('At least one symptom is required'),
  body('severity').optional().isIn(['mild', 'moderate', 'severe']),
  body('duration').optional().isString()
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

    const { symptoms, severity, duration, notes } = req.body;

    // Create health data entry for symptoms
    const symptomData = await HealthData.create({
      user: req.user.id,
      dataType: 'symptoms',
      source: 'manual',
      symptoms: symptoms.map(symptom => ({
        symptom: symptom.name || symptom,
        severity: severity || 'moderate',
        duration: duration || '',
        notes: notes || ''
      }))
    });

    // Simple AI-powered analysis (basic rules-based)
    let analysis = {
      urgency: 'routine',
      possibleCauses: [],
      recommendations: []
    };

    // Basic symptom analysis rules
    const seriousSymptoms = ['chest pain', 'difficulty breathing', 'severe headache', 'loss of consciousness'];
    const hasSeriousSymptom = symptoms.some(s => 
      seriousSymptoms.some(serious => 
        (s.name || s).toLowerCase().includes(serious.toLowerCase())
      )
    );

    if (hasSeriousSymptom) {
      analysis.urgency = 'emergency';
      analysis.recommendations.push('Seek immediate medical attention');
    } else {
      analysis.recommendations.push('Monitor your symptoms');
      analysis.recommendations.push('Consider scheduling a consultation if symptoms persist');
    }

    // Add simple condition matching
    if (symptoms.some(s => (s.name || s).toLowerCase().includes('fever'))) {
      analysis.possibleCauses.push('Viral infection', 'Flu', 'Common cold');
    }

    res.status(201).json({
      success: true,
      data: symptomData,
      analysis
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
