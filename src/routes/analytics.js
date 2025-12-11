const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const HealthProfile = require('../models/HealthProfile');
const HealthData = require('../models/HealthData');
const Consultation = require('../models/Consultation');
const UserMedication = require('../models/UserMedication');

// @desc    Get user's health analytics
// @route   GET /api/analytics/health
// @access  Private
router.get('/health', auth.protect, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let daysBack = 30;
    if (period === '7d') daysBack = 7;
    else if (period === '90d') daysBack = 90;
    else if (period === '1y') daysBack = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get health data for the period
    const healthData = await HealthData.find({
      user: req.user.id,
      recordedAt: { $gte: startDate }
    }).sort({ recordedAt: 1 });

    // Aggregate data by type
    const analytics = {
      period,
      dataPoints: healthData.length,
      overview: {
        totalDataPoints: healthData.length,
        daysWithData: [...new Set(healthData.map(d => d.recordedAt.toDateString()))].length,
        averageDataPerDay: Math.round(healthData.length / daysBack * 10) / 10
      },
      vitalSigns: {
        heartRate: { dataPoints: 0, average: null, trend: 'stable' },
        bloodPressure: { dataPoints: 0, averageSystolic: null, averageDiastolic: null, trend: 'stable' },
        weight: { dataPoints: 0, average: null, trend: 'stable' },
        glucose: { dataPoints: 0, average: null, trend: 'stable' }
      },
      activity: {
        dataPoints: 0,
        totalSteps: 0,
        averageSteps: 0,
        totalCalories: 0,
        activeDays: 0
      },
      sleep: {
        dataPoints: 0,
        totalDuration: 0,
        averageDuration: 0,
        efficiency: 0,
        qualityScore: 0
      },
      mentalHealth: {
        dataPoints: 0,
        averageMood: 0,
        averageStress: 0,
        moodTrend: 'stable'
      },
      trends: [],
      insights: []
    };

    let heartRates = [];
    let weights = [];
    let glucoseLevels = [];
    let activitySteps = [];
    let sleepDurations = [];
    let moodScores = [];

    healthData.forEach(data => {
      // Vital signs
      if (data.vitalSigns?.heartRate?.value) {
        heartRates.push(data.vitalSigns.heartRate.value);
        analytics.vitalSigns.heartRate.dataPoints++;
      }

      if (data.vitalSigns?.bloodPressure) {
        // Store for aggregation
        analytics.vitalSigns.bloodPressure.dataPoints++;
      }

      if (data.measurements?.weight?.value) {
        weights.push(data.measurements.weight.value);
        analytics.vitalSigns.weight.dataPoints++;
      }

      if (data.glucose?.value) {
        glucoseLevels.push(data.glucose.value);
        analytics.vitalSigns.glucose.dataPoints++;
      }

      // Activity
      if (data.activity?.steps) {
        activitySteps.push(data.activity.steps);
        analytics.activity.dataPoints++;
        analytics.activity.totalSteps += data.activity.steps;
        if (data.activity.calories) {
          analytics.activity.totalCalories += data.activity.calories;
        }
        if (data.activity.steps > 5000) {
          analytics.activity.activeDays++;
        }
      }

      // Sleep
      if (data.sleep?.duration) {
        sleepDurations.push(data.sleep.duration);
        analytics.sleep.dataPoints++;
        analytics.sleep.totalDuration += data.sleep.duration;
        if (data.sleep.efficiency) {
          analytics.sleep.efficiency += data.sleep.efficiency;
        }
        if (data.sleep.qualityScore) {
          analytics.sleep.qualityScore += data.sleep.qualityScore;
        }
      }

      // Mental health
      if (data.mentalHealth?.mood?.score) {
        moodScores.push(data.mentalHealth.mood.score);
        analytics.mentalHealth.dataPoints++;
      }
    });

    // Calculate averages
    if (heartRates.length > 0) {
      analytics.vitalSigns.heartRate.average = Math.round(heartRates.reduce((a, b) => a + b) / heartRates.length);
    }

    if (weights.length > 0) {
      analytics.vitalSigns.weight.average = Math.round(weights.reduce((a, b) => a + b) / weights.length * 10) / 10;
    }

    if (glucoseLevels.length > 0) {
      analytics.vitalSigns.glucose.average = Math.round(glucoseLevels.reduce((a, b) => a + b) / glucoseLevels.length);
    }

    if (activitySteps.length > 0) {
      analytics.activity.averageSteps = Math.round(activitySteps.reduce((a, b) => a + b) / activitySteps.length);
    }

    if (sleepDurations.length > 0) {
      analytics.sleep.averageDuration = Math.round(sleepDurations.reduce((a, b) => a + b) / sleepDurations.length);
      analytics.sleep.efficiency = Math.round(analytics.sleep.efficiency / sleepDurations.length);
      analytics.sleep.qualityScore = Math.round(analytics.sleep.qualityScore / sleepDurations.length * 10) / 10;
    }

    if (moodScores.length > 0) {
      analytics.mentalHealth.averageMood = Math.round(moodScores.reduce((a, b) => a + b) / moodScores.length * 10) / 10;
    }

    // Simple trend analysis
    if (heartRates.length >= 2) {
      const recent = heartRates.slice(-5);
      const older = heartRates.slice(0, 5);
      const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b) / older.length;
      
      if (recentAvg > olderAvg + 5) analytics.vitalSigns.heartRate.trend = 'increasing';
      else if (recentAvg < olderAvg - 5) analytics.vitalSigns.heartRate.trend = 'decreasing';
    }

    // Generate insights
    if (analytics.vitalSigns.heartRate.average > 100) {
      analytics.insights.push({
        type: 'warning',
        category: 'heart-rate',
        message: 'Your resting heart rate has been elevated. Consider consulting your doctor.',
        severity: 'medium'
      });
    }

    if (analytics.sleep.averageDuration < 7 * 60) {
      analytics.insights.push({
        type: 'info',
        category: 'sleep',
        message: 'You are getting less than the recommended 7-9 hours of sleep.',
        severity: 'low'
      });
    }

    if (analytics.activity.averageSteps < 5000) {
      analytics.insights.push({
        type: 'recommendation',
        category: 'activity',
        message: 'Try to increase your daily steps. Aim for at least 10,000 steps per day.',
        severity: 'low'
      });
    }

    res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get user's medication analytics
// @route   GET /api/analytics/medications
// @access  Private
router.get('/medications', auth.protect, async (req, res) => {
  try {
    const userMedications = await UserMedication.find({ user: req.user.id })
      .populate('medication', 'name drugClass')
      .sort({ startDate: -1 });

    const analytics = {
      totalMedications: userMedications.length,
      activeMedications: userMedications.filter(m => m.status === 'active').length,
      adherence: {
        excellent: userMedications.filter(m => m.complianceStatus === 'excellent').length,
        good: userMedications.filter(m => m.complianceStatus === 'good').length,
        fair: userMedications.filter(m => m.complianceStatus === 'fair').length,
        poor: userMedications.filter(m => m.complianceStatus === 'poor').length,
        critical: userMedications.filter(m => m.complianceStatus === 'critical').length
      },
      byClass: {},
      insights: []
    };

    // Group by drug class
    userMedications.forEach(userMed => {
      if (userMed.medication?.drugClass) {
        const className = userMed.medication.drugClass;
        if (!analytics.byClass[className]) {
          analytics.byClass[className] = 0;
        }
        analytics.byClass[className]++;
      }
    });

    // Generate insights
    const poorCompliance = userMedications.filter(m => 
      ['poor', 'critical'].includes(m.complianceStatus)
    ).length;

    if (poorCompliance > 0) {
      analytics.insights.push({
        type: 'warning',
        category: 'adherence',
        message: `${poorCompliance} medication(s) have poor adherence rates. Consider setting up reminders.`,
        severity: 'high'
      });
    }

    res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get consultation analytics
// @route   GET /api/analytics/consultations
// @access  Private
router.get('/consultations', auth.protect, async (req, res) => {
  try {
    let query = {};
    
    // Filter based on user role
    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user.id;
    }

    const consultations = await Consultation.find(query)
      .populate(req.user.role === 'doctor' ? 'patient' : 'doctor', 'firstName lastName')
      .sort({ scheduledDate: -1 });

    const analytics = {
      totalConsultations: consultations.length,
      byStatus: {
        scheduled: consultations.filter(c => c.status === 'scheduled').length,
        completed: consultations.filter(c => c.status === 'completed').length,
        cancelled: consultations.filter(c => c.status === 'cancelled').length,
        'no-show': consultations.filter(c => c.status === 'no-show').length
      },
      byType: {
        video: consultations.filter(c => c.type === 'video').length,
        audio: consultations.filter(c => c.type === 'audio').length,
        chat: consultations.filter(c => c.type === 'chat').length,
        'in-person': consultations.filter(c => c.type === 'in-person').length
      },
      averageRating: 0,
      insights: []
    };

    // Calculate average rating
    const ratedConsultations = consultations.filter(c => c.patientRating);
    if (ratedConsultations.length > 0) {
      analytics.averageRating = Math.round(
        ratedConsultations.reduce((sum, c) => sum + c.patientRating, 0) / ratedConsultations.length * 10
      ) / 10;
    }

    // Generate insights
    const completionRate = (analytics.byStatus.completed / analytics.totalConsultations * 100).toFixed(1);
    analytics.insights.push({
      type: 'info',
      category: 'consultations',
      message: `Completion rate: ${completionRate}%`,
      severity: 'low'
    });

    if (analytics.averageRating >= 4.5) {
      analytics.insights.push({
        type: 'success',
        category: 'satisfaction',
        message: `Excellent average rating: ${analytics.averageRating}/5`,
        severity: 'low'
      });
    }

    res.status(200).json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get overall health score
// @route   GET /api/analytics/health-score
// @access  Private
router.get('/health-score', auth.protect, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const healthData = await HealthData.find({
      user: req.user.id,
      recordedAt: { $gte: thirtyDaysAgo }
    });

    const userMedications = await UserMedication.find({
      user: req.user.id,
      status: 'active'
    });

    const consultations = await Consultation.find({
      patient: req.user.id,
      status: 'completed',
      scheduledDate: { $gte: thirtyDaysAgo }
    });

    let score = 100;
    const factors = [];

    // Vital signs score (30% of total)
    let vitalsScore = 100;
    let vitalsCount = 0;

    const heartRates = healthData.filter(d => d.vitalSigns?.heartRate?.value);
    if (heartRates.length > 0) {
      vitalsCount++;
      const avgHR = heartRates.reduce((sum, d) => sum + d.vitalSigns.heartRate.value, 0) / heartRates.length;
      if (avgHR < 60 || avgHR > 100) {
        vitalsScore -= 20;
        factors.push({ factor: 'Irregular heart rate', impact: -20 });
      }
    }

    const sleepData = healthData.filter(d => d.sleep?.duration);
    if (sleepData.length > 0) {
      vitalsCount++;
      const avgSleep = sleepData.reduce((sum, d) => sum + d.sleep.duration, 0) / sleepData.length;
      if (avgSleep < 7 * 60) { // Less than 7 hours
        vitalsScore -= 15;
        factors.push({ factor: 'Insufficient sleep', impact: -15 });
      }
    }

    // Medication adherence score (25% of total)
    let medicationScore = 100;
    if (userMedications.length > 0) {
      const avgAdherence = userMedications.reduce((sum, m) => sum + m.adherence.adherenceRate, 0) / userMedications.length;
      if (avgAdherence < 80) {
        medicationScore = avgAdherence;
        factors.push({ 
          factor: 'Poor medication adherence', 
          impact: -(100 - avgAdherence) * 0.25 
        });
      }
    }

    // Activity score (20% of total)
    let activityScore = 100;
    const activityData = healthData.filter(d => d.activity?.steps);
    if (activityData.length > 0) {
      const avgSteps = activityData.reduce((sum, d) => sum + d.activity.steps, 0) / activityData.length;
      if (avgSteps < 5000) {
        activityScore = (avgSteps / 5000) * 100;
        factors.push({ 
          factor: 'Low activity level', 
          impact: -(100 - activityScore) * 0.2 
        });
      }
    }

    // Consultation frequency score (15% of total)
    let consultationScore = 100;
    if (consultations.length === 0 && healthData.length > 20) {
      consultationScore = 70;
      factors.push({ factor: 'No recent consultations despite data', impact: -30 });
    }

    // Mental health score (10% of total)
    let mentalHealthScore = 100;
    const moodData = healthData.filter(d => d.mentalHealth?.mood?.score);
    if (moodData.length > 0) {
      const avgMood = moodData.reduce((sum, d) => sum + d.mentalHealth.mood.score, 0) / moodData.length;
      if (avgMood < 6) {
        mentalHealthScore = (avgMood / 10) * 100;
        factors.push({ 
          factor: 'Low mood scores', 
          impact: -(100 - mentalHealthScore) * 0.1 
        });
      }
    }

    // Calculate weighted score
    const finalScore = Math.round(
      (vitalsScore * 0.3) + 
      (medicationScore * 0.25) + 
      (activityScore * 0.2) + 
      (consultationScore * 0.15) + 
      (mentalHealthScore * 0.1)
    );

    let scoreLevel = 'Excellent';
    if (finalScore < 80) scoreLevel = 'Good';
    if (finalScore < 60) scoreLevel = 'Fair';
    if (finalScore < 40) scoreLevel = 'Poor';

    const healthScore = {
      score: finalScore,
      level: scoreLevel,
      factors,
      recommendations: []
    };

    // Add recommendations
    if (finalScore < 60) {
      healthScore.recommendations.push('Consider consulting with your healthcare provider');
    }
    if (factors.some(f => f.factor.includes('sleep'))) {
      healthScore.recommendations.push('Focus on improving sleep quality and duration');
    }
    if (factors.some(f => f.factor.includes('activity'))) {
      healthScore.recommendations.push('Increase daily physical activity');
    }

    res.status(200).json({
      success: true,
      healthScore
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get personalized recommendations
// @route   GET /api/analytics/recommendations
// @access  Private
router.get('/recommendations', auth.protect, async (req, res) => {
  try {
    const healthData = await HealthData.find({
      user: req.user.id
    }).sort({ recordedAt: -1 }).limit(30);

    const userMedications = await UserMedication.find({
      user: req.user.id,
      status: 'active'
    });

    const recommendations = [];

    // Sleep recommendations
    const sleepData = healthData.filter(d => d.sleep?.duration);
    if (sleepData.length > 0) {
      const avgSleep = sleepData.reduce((sum, d) => sum + d.sleep.duration, 0) / sleepData.length;
      if (avgSleep < 7 * 60) {
        recommendations.push({
          type: 'sleep',
          priority: 'high',
          title: 'Improve Sleep Duration',
          description: 'Your average sleep duration is below the recommended 7-9 hours.',
          actions: [
            'Establish a consistent bedtime routine',
            'Avoid screens 1 hour before bed',
            'Keep bedroom cool and dark',
            'Consider relaxation techniques'
          ]
        });
      }
    }

    // Activity recommendations
    const activityData = healthData.filter(d => d.activity?.steps);
    if (activityData.length > 0) {
      const avgSteps = activityData.reduce((sum, d) => sum + d.activity.steps, 0) / activityData.length;
      if (avgSteps < 10000) {
        recommendations.push({
          type: 'activity',
          priority: 'medium',
          title: 'Increase Daily Activity',
          description: 'Try to reach 10,000 steps per day for better cardiovascular health.',
          actions: [
            'Take short walks throughout the day',
            'Use stairs instead of elevators',
            'Schedule exercise time',
            'Track progress with your wearable device'
          ]
        });
      }
    }

    // Medication adherence recommendations
    const poorAdherenceMedications = userMedications.filter(m => 
      m.complianceStatus === 'poor' || m.complianceStatus === 'critical'
    );

    if (poorAdherenceMedications.length > 0) {
      recommendations.push({
        type: 'medication',
        priority: 'high',
        title: 'Improve Medication Adherence',
        description: 'Several medications show poor adherence rates.',
        actions: [
          'Set up medication reminders',
          'Use pill organizers',
          'Understand the importance of each medication',
          'Talk to your doctor about any concerns'
        ]
      });
    }

    // Mental health recommendations
    const moodData = healthData.filter(d => d.mentalHealth?.mood?.score);
    if (moodData.length > 0) {
      const avgMood = moodData.reduce((sum, d) => sum + d.mentalHealth.mood.score, 0) / moodData.length;
      if (avgMood < 6) {
        recommendations.push({
          type: 'mental-health',
          priority: 'medium',
          title: 'Support Mental Well-being',
          description: 'Your mood scores suggest room for improvement.',
          actions: [
            'Practice mindfulness or meditation',
            'Maintain social connections',
            'Consider speaking with a mental health professional',
            'Engage in activities you enjoy'
          ]
        });
      }
    }

    // General health recommendations
    recommendations.push({
      type: 'general',
      priority: 'low',
      title: 'Maintain Regular Check-ups',
      description: 'Regular health screenings help catch issues early.',
      actions: [
        'Schedule annual physical examinations',
        'Stay up-to-date with vaccinations',
        'Keep health records organized',
        'Monitor key health metrics regularly'
      ]
    });

    res.status(200).json({
      success: true,
      recommendations,
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

// @desc    Export health data
// @route   GET /api/analytics/export
// @access  Private
router.get('/export', auth.protect, async (req, res) => {
  try {
    const { type = 'health-data', format = 'json', startDate, endDate } = req.query;

    let data = {};
    const query = { user: req.user.id };

    if (startDate || endDate) {
      query.recordedAt = {};
      if (startDate) query.recordedAt.$gte = new Date(startDate);
      if (endDate) query.recordedAt.$lte = new Date(endDate);
    }

    switch (type) {
      case 'health-data':
        data.healthData = await HealthData.find(query).sort({ recordedAt: 1 });
        break;
      case 'medications':
        data.medications = await UserMedication.find({ user: req.user.id })
          .populate('medication')
          .sort({ startDate: 1 });
        break;
      case 'consultations':
        data.consultations = await Consultation.find({ 
          ...query,
          $or: [
            { patient: req.user.id },
            { doctor: req.user.id }
          ]
        }).sort({ scheduledDate: 1 });
        break;
      case 'all':
        data.healthData = await HealthData.find(query).sort({ recordedAt: 1 });
        data.medications = await UserMedication.find({ user: req.user.id })
          .populate('medication')
          .sort({ startDate: 1 });
        data.consultations = await Consultation.find({
          ...query,
          $or: [
            { patient: req.user.id },
            { doctor: req.user.id }
          ]
        }).sort({ scheduledDate: 1 });
        break;
    }

    res.status(200).json({
      success: true,
      data,
      exportedAt: new Date(),
      format
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
