import mongoose, { Schema } from 'mongoose';

const UserSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Broker specific fields
  companyName: { type: String },
  licenseNumber: { type: String },

  // Verification Status
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },

  // OTP Fields
  emailOTP: { type: String },
  emailOTPExpires: { type: Date },
  phoneOTP: { type: String },
  phoneOTPExpires: { type: Date },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', UserSchema);
