import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import { Request, Response } from 'express';
import { sendEmailOTP } from '@/services/emailService';
import { sendSMSOTP } from '@/services/smsService';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || '';

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, password, companyName, licenseNumber } = req.body;
    
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ success: false, message: 'Email already exists' });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(400).json({ success: false, message: 'Phone number already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      companyName,
      licenseNumber,
    });

    await newUser.save();

    return res.status(201).json({ 
      success: true, 
      message: 'User registered successfully. Please request an OTP to verify your account.' 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user: any = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ 
      success: true, 
      data: { 
        token, 
        user: { 
          id: user._id, 
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified
        } 
      } 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const requestOTP = async (req: any, res: Response) => {
  try {
    const { type } = req.body; // 'email' or 'phone'
    const user: any = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    if (type === 'email') {
      if (user.emailVerified) return res.status(400).json({ success: false, message: 'Email already verified' });
      user.emailOTP = otp;
      user.emailOTPExpires = expires;
      await user.save();
      await sendEmailOTP(user.email, otp);
      return res.json({ success: true, message: 'OTP sent to your email.' });
    } else if (type === 'phone') {
      if (user.phoneVerified) return res.status(400).json({ success: false, message: 'Phone already verified' });
      user.phoneOTP = otp;
      user.phoneOTPExpires = expires;
      await user.save();
      await sendSMSOTP(user.phone, otp);
      return res.json({ success: true, message: 'OTP sent to your phone.' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid type. Use "email" or "phone".' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyEmail = async (req: any, res: Response) => {
  try {
    const { otp } = req.body;
    const user: any = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.emailVerified) return res.status(400).json({ success: false, message: 'Email already verified' });

    if (!user.emailOTP || user.emailOTP !== otp || user.emailOTPExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.emailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpires = undefined;
    await user.save();

    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyPhone = async (req: any, res: Response) => {
  try {
    const { otp } = req.body;
    const user: any = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.phoneVerified) return res.status(400).json({ success: false, message: 'Phone already verified' });

    if (!user.phoneOTP || user.phoneOTP !== otp || user.phoneOTPExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.phoneVerified = true;
    user.phoneOTP = undefined;
    user.phoneOTPExpires = undefined;
    await user.save();

    return res.json({ success: true, message: 'Phone verified successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
