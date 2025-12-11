const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  // Basic Information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Consultation Details
  type: {
    type: String,
    enum: ['video', 'audio', 'chat', 'in-person'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  
  // Scheduling
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // minutes
    default: 30
  },
  actualDuration: Number,
  
  // Meeting Details (for video/audio)
  meetingId: String,
  meetingUrl: String,
  roomToken: String,
  
  // Medical Information
  chiefComplaint: {
    type: String,
    required: true
  },
  symptoms: [{
    symptom: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    duration: String,
    notes: String
  }],
  
  // Consultation Notes (Doctor's assessment)
  diagnosis: String,
  differentialDiagnosis: [String],
  clinicalFindings: String,
  treatmentPlan: String,
  followUpInstructions: String,
  
  // Prescriptions
  prescriptions: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String,
    refills: Number,
    prescribedDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Tests and Referrals
  labOrders: [{
    testName: String,
    urgency: {
      type: String,
      enum: ['routine', 'urgent', 'stat']
    },
    instructions: String,
    orderedDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  referrals: [{
    specialty: String,
    reason: String,
    urgency: {
      type: String,
      enum: ['routine', 'urgent', 'stat']
    },
    notes: String,
    referredDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Payment
  consultationFee: Number,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'waived'],
    default: 'pending'
  },
  paymentMethod: String,
  paymentTransactionId: String,
  
  // Rating and Feedback
  patientRating: {
    type: Number,
    min: 1,
    max: 5
  },
  patientFeedback: String,
  doctorNotes: String,
  
  // Technical Issues
  technicalIssues: [{
    issue: String,
    timestamp: Date,
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  
  // Emergency Protocol
  isEmergency: {
    type: Boolean,
    default: false
  },
  emergencyActions: [String],
  
  // Recording and Documentation
  consultationRecording: {
    url: String,
    duration: Number,
    size: Number,
    consentGiven: {
      type: Boolean,
      default: false
    }
  },
  
  // Files and Attachments
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Follow-up
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  followUpNotes: String,
  
  // AI Features
  aiSummary: String,
  aiRiskAssessment: String,
  
  // Integration Data
  ehrIntegration: {
    synced: {
      type: Boolean,
      default: false
    },
    ehrRecordId: String,
    syncedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for consultation status
consultationSchema.virtual('isActive').get(function() {
  return ['scheduled', 'in-progress'].includes(this.status);
});

// Virtual for time until consultation
consultationSchema.virtual('timeUntilConsultation').get(function() {
  const now = new Date();
  return this.scheduledDate - now;
});

// Indexes
consultationSchema.index({ patient: 1, scheduledDate: -1 });
consultationSchema.index({ doctor: 1, scheduledDate: -1 });
consultationSchema.index({ status: 1 });
consultationSchema.index({ scheduledDate: 1 });

module.exports = mongoose.model('Consultation', consultationSchema);
