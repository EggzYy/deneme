const mongoose = require('mongoose');

const userMedicationSchema = new mongoose.Schema({
  // Basic Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: true
  },
  
  // Prescription Details
  prescribedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  consultation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation'
  },
  
  // Dosage Information
  prescribedDosage: {
    amount: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true // e.g., "twice daily", "every 8 hours", "as needed"
    }
  },
  
  // Schedule and Timing
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  instructions: String,
  
  // Refills
  refillsAuthorized: {
    type: Number,
    default: 0
  },
  refillsRemaining: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'discontinued', 'paused'],
    default: 'active'
  },
  
  // Pharmacy Information
  pharmacy: {
    name: String,
    address: String,
    phone: String,
    pharmacist: String
  },
  
  // Reminder Settings
  reminders: {
    enabled: {
      type: Boolean,
      default: true
    },
    times: [{
      time: String, // "08:00", "14:30", etc.
      label: String // "Morning", "Evening", etc.
    }],
    methods: [{
      type: {
        type: String,
        enum: ['push', 'email', 'sms']
      },
      enabled: {
        type: Boolean,
        default: true
      }
    }],
    advanceNotice: {
      type: Number,
      default: 15 // minutes before
    }
  },
  
  // Adherence Tracking
  adherence: {
    totalScheduled: {
      type: Number,
      default: 0
    },
    takenCorrectly: {
      type: Number,
      default: 0
    },
    missed: {
      type: Number,
      default: 0
    },
    takenIncorrectly: {
      type: Number,
      default: 0
    },
    lastTaken: Date,
    adherenceRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  
  // Side Effects Tracking
  sideEffects: [{
    effect: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    dateReported: {
      type: Date,
      default: Date.now
    },
    notes: String,
    reportedToDoctor: {
      type: Boolean,
      default: false
    }
  }],
  
  // Effectiveness Tracking
  effectiveness: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String,
    lastRated: Date
  },
  
  // Cost Tracking
  cost: {
    perDose: Number,
    monthlyCost: Number,
    insuranceCoverage: Number,
    copayAmount: Number
  },
  
  // Special Instructions
  specialInstructions: [String],
  foodInteractions: [String],
  alcoholInteractions: [String],
  
  // Storage
  storageLocation: String,
  storageInstructions: String,
  
  // AI and Smart Features
  aiInsights: [{
    type: {
      type: String,
      enum: ['adherence-pattern', 'interaction-warning', 'missed-dose-analysis', 'effectiveness-prediction']
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
  
  // Integration with Wearables
  wearableIntegration: {
    syncEnabled: {
      type: Boolean,
      default: false
    },
    devices: [String],
    syncFrequency: {
      type: String,
      enum: ['real-time', 'hourly', 'daily']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days remaining
userMedicationSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const today = new Date();
  const timeDiff = this.endDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Virtual for compliance status
userMedicationSchema.virtual('complianceStatus').get(function() {
  if (this.adherence.adherenceRate >= 90) return 'excellent';
  if (this.adherence.adherenceRate >= 80) return 'good';
  if (this.adherence.adherenceRate >= 70) return 'fair';
  if (this.adherence.adherenceRate >= 60) return 'poor';
  return 'critical';
});

// Method to update adherence
userMedicationSchema.methods.updateAdherence = function(wasTakenCorrectly = true, wasScheduled = true) {
  this.adherence.totalScheduled += 1;
  
  if (wasScheduled) {
    if (wasTakenCorrectly) {
      this.adherence.takenCorrectly += 1;
      this.adherence.lastTaken = new Date();
    } else {
      this.adherence.takenIncorrectly += 1;
    }
  } else {
    this.adherence.missed += 1;
  }
  
  // Calculate adherence rate
  if (this.adherence.totalScheduled > 0) {
    this.adherence.adherenceRate = Math.round((this.adherence.takenCorrectly / this.adherence.totalScheduled) * 100);
  }
};

// Indexes
userMedicationSchema.index({ user: 1, status: 1 });
userMedicationSchema.index({ medication: 1 });
userMedicationSchema.index({ prescribedBy: 1 });

module.exports = mongoose.model('UserMedication', userMedicationSchema);
