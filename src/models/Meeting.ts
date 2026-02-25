import mongoose, { Schema } from 'mongoose';

const MeetingSchema: Schema = new Schema({
  brokerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  audioUrl: { type: String }, // Link to recorded audio (S3 or local)
  transcript: { type: String }, // Raw transcript from STT
  speakers: [{
    speakerId: String,
    role: String,
    name: String
  }],

  // Structured Deal Intelligence
  clientProfile: {
    budgetRange: { type: String },
    loanRequirement: { type: String },
    familySize: { type: String },
    urgency: { type: String },
  },
  interestSignals: {
    preference: { type: String }, // e.g. 2BHK vs 3BHK
    floorPreference: { type: String },
    vastuImportance: { type: String },
    locationPriority: { type: String },
    parkingRequirement: { type: String },
  },
  financialIntelligence: {
    expectedRent: { type: String },
    builderScheme: { type: String },
    negotiationPossibility: { type: String },
    discountProbability: { type: String },
    holdingPeriod: { type: String },
  },

  dealProbabilityScore: { type: Number }, // 0 to 100
  keyConcerns: [{ type: String }],
  suggestedAction: { type: String },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Meeting', MeetingSchema);
