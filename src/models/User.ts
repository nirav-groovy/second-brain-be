import mongoose, { Schema } from 'mongoose';
import { UserRole, UserStatus } from '@/types/enums';

const UserSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // Verification Status
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },

  // OTP Fields
  emailOTP: { type: String },
  emailOTPExpires: { type: Date },
  phoneOTP: { type: String },
  phoneOTPExpires: { type: Date },

  // Role and Status fields
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER
  },
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', UserSchema);
