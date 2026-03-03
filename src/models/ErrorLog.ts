import mongoose, { Schema, Document } from 'mongoose';

export interface IErrorLog extends Document {
  userId?: mongoose.Types.ObjectId;
  source: 'API' | 'BACKGROUND_TASK' | 'SYSTEM';
  level: 'ERROR' | 'WARN' | 'CRITICAL';
  message: string;
  name?: string;
  functionName?: string;
  stack?: string;
  endpoint?: string;
  method?: string;
  requestBody?: any;
  queryParams?: any;
  context?: any;
  ipAddress?: string;
  timestamp: Date;
}

const ErrorLogSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  source: { type: String, enum: ['API', 'BACKGROUND_TASK', 'SYSTEM'], required: true, index: true },
  level: { type: String, enum: ['ERROR', 'WARN', 'CRITICAL'], default: 'ERROR' },
  message: { type: String, required: true },
  name: { type: String },
  functionName: { type: String, index: true },
  stack: { type: String },
  endpoint: { type: String },
  method: { type: String },
  requestBody: { type: Schema.Types.Mixed },
  queryParams: { type: Schema.Types.Mixed },
  context: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Auto-delete logs older than 30 days to save space
ErrorLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model<IErrorLog>('ErrorLog', ErrorLogSchema);
