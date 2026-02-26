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

  // New Simplified Structure
  promptUsed: { type: String, enum: ['nirav', 'pankaj'], required: true },
  ai_response: { type: Schema.Types.Mixed }, // Stores the full JSON from Azure OpenAI

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Meeting', MeetingSchema);
