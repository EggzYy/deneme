const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  genericName: String,
  brandName: [String],
  drugClass: String,
  drugCategory: {
    type: String,
    enum: ['prescription', 'otc', 'supplement', 'herbal']
  },
  
  // Drug Information
  ndcNumber: String, // National Drug Code
  rxcui: String, // RxNorm Concept Unique Identifier
  description: String,
  
  // Dosage and Administration
  dosage: {
    strength: String,
    unit: String, // mg, ml, tablets, etc.
    form: {
      type: String,
      enum: ['tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'patch', 'other']
    }
  },
  
  // Indications and Uses
  indications: [String],
  contraindications: [String],
  sideEffects: [{
    effect: String,
    severity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'serious']
    },
    frequency: String
  }],
  
  // Drug Interactions
  interactions: [{
    drugName: String,
    interactionType: {
      type: String,
      enum: ['major', 'moderate', 'minor']
    },
    description: String,
    clinicalEffect: String
  }],
  
  // Dosage Guidelines
  dosageGuidelines: {
    adultDosage: String,
    pediatricDosage: String,
    geriatricDosage: String,
    renalImpairment: String,
    hepaticImpairment: String
  },
  
  // Storage and Handling
  storageConditions: String,
  handlingInstructions: String,
  
  // FDA Information
  fdaApproved: {
    type: Boolean,
    default: true
  },
  approvalDate: Date,
  
  // Manufacturer Information
  manufacturer: {
    name: String,
    contact: String,
    website: String
  },
  
  // Cost and Insurance
  averageCost: Number,
  insuranceCoverage: {
    covered: Boolean,
    copayAmount: Number,
    priorAuthRequired: Boolean
  },
  
  // Regulatory Information
  schedule: {
    type: String,
    enum: ['unscheduled', 'I', 'II', 'III', 'IV', 'V']
  },
  pregnancyCategory: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'X']
  },
  
  // Black Box Warnings
  blackBoxWarnings: [String],
  
  // Additional Information
  notes: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for search optimization
medicationSchema.index({ name: 'text', genericName: 'text', brandName: 'text' });
medicationSchema.index({ drugClass: 1 });
medicationSchema.index({ drugCategory: 1 });

module.exports = mongoose.model('Medication', medicationSchema);
