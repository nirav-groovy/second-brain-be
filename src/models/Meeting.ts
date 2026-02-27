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

  // CRM Fields extracted from AI response
  clientName: { type: String, index: true },
  clientPhone: { type: String },
  clientEmail: { type: String },
  conversationType: { type: String, enum: ['Buyer', 'Seller', 'General', 'Other', 'Under Evaluation'], index: true },
  dealProbabilityScore: { type: Number, min: 0, max: 100 },

  // New Simplified Structure
  promptUsed: { type: String, enum: ['nirav', 'pankaj'], required: true },
  ai_response: { type: Schema.Types.Mixed }, // Stores the full JSON from Azure OpenAI
  long_transcript: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['transcribe-generating', 'speakers-generating', 'intelligence-generating', 'completed', 'failed'],
    default: 'completed'
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Meeting', MeetingSchema);
