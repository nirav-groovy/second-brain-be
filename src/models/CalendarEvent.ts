import mongoose, { Schema } from 'mongoose';

const CalendarEventSchema: Schema = new Schema({
  brokerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
  title: { type: String, required: true },
  description: { type: String },
  eventDate: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('CalendarEvent', CalendarEventSchema);
