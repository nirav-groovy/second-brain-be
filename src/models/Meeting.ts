import mongoose, { Schema } from 'mongoose';
import { MeetingStatus } from '@/types/enums';

const MeetingSchema: Schema = new Schema({
  brokerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true },
  audioUrl: { type: String }, // Link to recorded audio (S3 or local)
  transcript: { type: String }, // Raw transcript from STT

  // CRM Fields extracted from AI response (Directly stored)
  clientName: { type: String, index: true },
  clientPhone: { type: String },
  clientEmail: { type: String },
  detectedContext: {
    industry: [String],
    nature: [String]
  },
  conversationType: { type: String, index: true },
  priorityScore: { type: Number, min: 0, max: 100 },

  summary: { type: String },
  keyTakeaway: { type: String },
  mainKeyPoints: [{
    point: String,
    party: String,
    category: String
  }],
  participantProfiles: [{
    id: String,
    name: String,
    role: String,
    attributes: Schema.Types.Mixed
  }],
  actionItems: [{
    date: String,
    task: String,
    performedBy: String
  }],
  suggestedAction: { type: String },
  metadata: { type: Schema.Types.Mixed },

  long_transcript: { type: Boolean, default: false },
  originalTranscript: { type: String },

  status: {
    type: String,
    enum: Object.values(MeetingStatus),
    default: MeetingStatus.COMPLETED
  },

  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for backward compatibility with frontend that expects 'ai_response' object
MeetingSchema.virtual('ai_response').get(function () {
  return {
    detectedContext: this.detectedContext,
    conversationType: this.conversationType,
    summary: this.summary,
    keyTakeaway: this.keyTakeaway,
    mainKeyPoints: this.mainKeyPoints,
    participantProfiles: this.participantProfiles,
    actionItems: this.actionItems,
    priorityScore: this.priorityScore,
    suggestedAction: this.suggestedAction,
    metadata: this.metadata,
    client_name: this.clientName
  };
});

export default mongoose.model('Meeting', MeetingSchema);
