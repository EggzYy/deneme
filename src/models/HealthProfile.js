const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Basic Health Info
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  
  // Medical History
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    status: {
      type: String,
      enum: ['active', 'resolved', 'chronic', 'in-treatment']
    },
    notes: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    }
  }],
  
  // Allergies
  allergies: [{
    allergen: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'life-threatening'],
      required: true
    },
    reaction: String,
    diagnosedDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Current Medications (simplified reference)
  medications: [{
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication'
    },
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    prescribedBy: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Vital Signs
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
      recordedAt: Date
    },
    heartRate: {
      value: Number,
      recordedAt: Date
    },
    temperature: {
      value: Number,
      unit: { type: String, enum: ['celsius', 'fahrenheit'], default: 'celsius' },
      recordedAt: Date
    },
    weight: {
      value: Number,
      unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' },
      recordedAt: Date
    },
    height: {
      value: Number,
      unit: { type: String, enum: ['cm', 'inches'], default: 'cm' }
    },
    bmi: Number,
    bloodSugar: {
      value: Number,
      type: { type: String, enum: ['fasting', 'random', 'post-meal'] },
      recordedAt: Date
    },
    oxygenSaturation: {
      value: Number,
      recordedAt: Date
    }
  },
  
  // Lifestyle Information
  lifestyle: {
    smoking: {
      status: {
        type: String,
        enum: ['never', 'former', 'current']
      },
      packsPerDay: Number,
      yearsSmoked: Number,
      quitDate: Date
    },
    alcohol: {
      consumption: {
        type: String,
        enum: ['never', 'rarely', 'socially', 'regularly', 'heavily']
      },
      drinksPerWeek: Number
    },
    exercise: {
      frequency: {
        type: String,
        enum: ['never', 'rarely', '1-2-times-week', '3-4-times-week', 'daily']
      },
      type: [String],
      duration: Number // minutes per session
    },
    diet: {
      type: { type: String, enum: ['regular', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'other'] },
      restrictions: [String],
      notes: String
    },
    sleep: {
      hoursPerNight: Number,
      quality: {
        type: String,
        enum: ['very-poor', 'poor', 'fair', 'good', 'excellent']
      },
      sleepDisorders: [String]
    },
    stressLevel: {
      type: String,
      enum: ['very-low', 'low', 'moderate', 'high', 'very-high']
    }
  },
  
  // Family History
  familyHistory: [{
    relationship: {
      type: String,
      enum: ['mother', 'father', 'sibling', 'grandparent', 'uncle', 'aunt', 'cousin']
    },
    conditions: [String],
    ageAtDiagnosis: Number
  }],
  
  // Immunizations
  immunizations: [{
    vaccine: String,
    dateAdministered: Date,
    nextDueDate: Date,
    administeredBy: String,
    reaction: String
  }],
  
  // Screening Tests
  screenings: [{
    testType: String,
    datePerformed: Date,
    result: String,
    nextDueDate: Date,
    performedBy: String
  }],
  
  // Health Goals
  healthGoals: [{
    goal: String,
    targetDate: Date,
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'achieved', 'paused', 'cancelled']
    },
    progress: {
      type: Number,
      min: 0,
      max: 100
    },
    notes: String
  }],
  
  // Risk Factors
  riskFactors: [{
    factor: String,
    level: {
      type: String,
      enum: ['low', 'moderate', 'high']
    },
    notes: String
  }],
  
  // AI/ML Insights
  aiInsights: [{
    type: {
      type: String,
      enum: ['risk-assessment', 'recommendation', 'trend-analysis', 'anomaly-detection']
    },
    insight: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    recommendations: [String],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Privacy Settings
  privacy: {
    shareWithDoctors: { type: Boolean, default: true },
    shareForResearch: { type: Boolean, default: false },
    allowAnalytics: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for BMI calculation
healthProfileSchema.virtual('calculatedBMI').get(function() {
  if (this.vitalSigns.height && this.vitalSigns.weight) {
    const heightInMeters = this.vitalSigns.height.value / 100;
    return (this.vitalSigns.weight.value / (heightInMeters * heightInMeters)).toFixed(1);
  }
  return null;
});

// Index for efficient querying
healthProfileSchema.index({ user: 1 });
healthProfileSchema.index({ 'medicalHistory.condition': 1 });
healthProfileSchema.index({ 'allergies.allergen': 1 });

module.exports = mongoose.model('HealthProfile', healthProfileSchema);
