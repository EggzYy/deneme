const mongoose = require('mongoose');

const healthDataSchema = new mongoose.Schema({
  // Basic Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Data Type and Source
  dataType: {
    type: String,
    required: true,
    enum: [
      'vital-signs', 'symptoms', 'activity', 'sleep', 'nutrition',
      'medication-intake', 'lab-results', 'mental-health', 'exercise',
      'heart-rate', 'blood-pressure', 'weight', 'glucose', 'oxygen-saturation',
      'temperature', 'mood', 'stress-level'
    ]
  },
  
  // Source of Data
  source: {
    type: String,
    enum: ['manual', 'wearable', 'iot-device', 'lab-test', 'doctor-input', 'ai-detection'],
    default: 'manual'
  },
  device: {
    name: String,
    model: String,
    manufacturer: String,
    id: String
  },
  
  // Timestamp
  recordedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Vital Signs Data
  vitalSigns: {
    heartRate: {
      value: Number,
      unit: { type: String, default: 'bpm' },
      irregular: Boolean,
      arrhythmia: Boolean
    },
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
      unit: { type: String, default: 'mmHg' },
      position: { type: String, enum: ['sitting', 'standing', 'lying-down'] }
    },
    temperature: {
      value: Number,
      unit: { type: String, enum: ['celsius', 'fahrenheit'], default: 'celsius' }
    },
    respiratoryRate: {
      value: Number,
      unit: { type: String, default: 'breaths/min' }
    },
    oxygenSaturation: {
      value: Number,
      unit: { type: String, default: '%' },
      withOxygen: Boolean
    }
  },
  
  // Physical Measurements
  measurements: {
    weight: {
      value: Number,
      unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' }
    },
    height: {
      value: Number,
      unit: { type: String, enum: ['cm', 'inches'], default: 'cm' }
    },
    bmi: Number,
    bodyFatPercentage: Number,
    muscleMass: Number,
    waterPercentage: Number,
    boneMass: Number
  },
  
  // Blood Glucose
  glucose: {
    value: Number,
    unit: { type: String, enum: ['mg/dL', 'mmol/L'], default: 'mg/dL' },
    type: { type: String, enum: ['fasting', 'post-meal', 'random', 'bedtime'] },
    fasting: Boolean,
    hoursSinceMeal: Number
  },
  
  // Activity Data
  activity: {
    steps: Number,
    distance: {
      value: Number,
      unit: { type: String, enum: ['meters', 'km', 'miles'], default: 'meters' }
    },
    calories: Number,
    activeMinutes: Number,
    exerciseType: [String],
    exerciseDuration: Number, // minutes
    intensity: { type: String, enum: ['low', 'moderate', 'high', 'very-high'] }
  },
  
  // Sleep Data
  sleep: {
    duration: Number, // minutes
    deepSleep: Number, // minutes
    lightSleep: Number, // minutes
    remSleep: Number, // minutes
    awakeDuration: Number, // minutes
    efficiency: Number, // percentage
    qualityScore: { type: Number, min: 1, max: 10 }
  },
  
  // Mental Health
  mentalHealth: {
    mood: {
      score: { type: Number, min: 1, max: 10 },
      emotions: [String],
      triggers: [String]
    },
    stress: {
      level: { type: Number, min: 1, max: 10 },
      factors: [String]
    },
    anxiety: {
      score: { type: Number, min: 1, max: 10 },
      symptoms: [String]
    },
    depression: {
      score: { type: Number, min: 1, max: 10 },
      symptoms: [String]
    }
  },
  
  // Symptoms
  symptoms: [{
    symptom: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    duration: String,
    location: String,
    triggers: [String],
    notes: String,
    onsetType: {
      type: String,
      enum: ['sudden', 'gradual', 'intermittent', 'constant']
    }
  }],
  
  // Nutrition Data
  nutrition: {
    meals: [{
      type: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
      foods: [{
        name: String,
        amount: Number,
        unit: String,
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
        sugar: Number,
        sodium: Number
      }],
      totalCalories: Number,
      notes: String
    }],
    waterIntake: {
      amount: Number,
      unit: { type: String, enum: ['ml', 'fl-oz', 'cups'], default: 'ml' }
    },
    supplements: [{
      name: String,
      amount: Number,
      unit: String,
      time: String
    }]
  },
  
  // Medication Intake
  medicationIntake: [{
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication'
    },
    userMedication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserMedication'
    },
    takenAt: Date,
    dosage: String,
    takenCorrectly: Boolean,
    missed: Boolean,
    notes: String
  }],
  
  // Environmental Data
  environment: {
    temperature: Number,
    humidity: Number,
    airQualityIndex: Number,
    pollutionLevel: Number,
    uvIndex: Number
  },
  
  // Location Data
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    address: String
  },
  
  // AI Analysis
  aiAnalysis: {
    insights: [String],
    anomalies: [String],
    recommendations: [String],
    riskScore: { type: Number, min: 0, max: 1 },
    confidence: { type: Number, min: 0, max: 1 }
  },
  
  // Alerts and Notifications
  alerts: [{
    type: {
      type: String,
      enum: ['critical', 'warning', 'info', 'success']
    },
    message: String,
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: Date,
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Data Quality
  quality: {
    confidence: { type: Number, min: 0, max: 1 },
    accuracy: { type: Number, min: 0, max: 1 },
    calibrationDate: Date,
    lastCalibration: Date
  },
  
  // Sync and Integration
  syncStatus: {
    synced: {
      type: Boolean,
      default: false
    },
    syncedAt: Date,
    syncedTo: [String], // e.g., ['ehr', 'cloud', 'other-app']
    externalId: String
  },
  
  // User Notes and Context
  userNotes: String,
  context: String, // What was the user doing when this was recorded
  
  // Doctor/Professional Notes
  professionalNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for BMI calculation
healthDataSchema.virtual('calculatedBMI').get(function() {
  if (this.measurements.height && this.measurements.weight) {
    const heightInMeters = this.measurements.height.unit === 'cm' ? 
      this.measurements.height.value / 100 : 
      this.measurements.height.value * 0.0254;
    const weightInKg = this.measurements.weight.unit === 'kg' ? 
      this.measurements.weight.value : 
      this.measurements.weight.value * 0.453592;
    return (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
  }
  return null;
});

// Virtual for data age
healthDataSchema.virtual('dataAge').get(function() {
  const now = new Date();
  const diff = now - this.recordedAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours };
});

// Method to check if data requires attention
healthDataSchema.methods.requiresAttention = function() {
  // Critical values that need immediate attention
  const criticalValues = {
    heartRate: { min: 40, max: 180 },
    systolic: { min: 90, max: 180 },
    diastolic: { min: 50, max: 120 },
    temperature: { min: 35, max: 40 },
    oxygenSaturation: { min: 90, max: 100 },
    glucose: { min: 50, max: 400 }
  };

  let alerts = [];
  
  if (this.vitalSigns.heartRate) {
    const hr = this.vitalSigns.heartRate.value;
    if (hr < criticalValues.heartRate.min || hr > criticalValues.heartRate.max) {
      alerts.push({ type: 'critical', message: 'Heart rate outside normal range' });
    }
  }

  if (this.vitalSigns.bloodPressure) {
    const bp = this.vitalSigns.bloodPressure;
    if (bp.systolic < criticalValues.systolic.min || bp.systolic > criticalValues.systolic.max) {
      alerts.push({ type: 'critical', message: 'Systolic blood pressure outside normal range' });
    }
    if (bp.diastolic < criticalValues.diastolic.min || bp.diastolic > criticalValues.diastolic.max) {
      alerts.push({ type: 'critical', message: 'Diastolic blood pressure outside normal range' });
    }
  }

  if (this.glucose) {
    const glucose = this.glucose.value;
    if (glucose < criticalValues.glucose.min || glucose > criticalValues.glucose.max) {
      alerts.push({ type: 'critical', message: 'Blood glucose outside normal range' });
    }
  }

  return alerts;
};

// Indexes for efficient querying
healthDataSchema.index({ user: 1, recordedAt: -1 });
healthDataSchema.index({ dataType: 1, recordedAt: -1 });
healthDataSchema.index({ source: 1 });
healthDataSchema.index({ 'vitalSigns.heartRate.value': 1 });
healthDataSchema.index({ 'vitalSigns.bloodPressure.systolic': 1 });

module.exports = mongoose.model('HealthData', healthDataSchema);
