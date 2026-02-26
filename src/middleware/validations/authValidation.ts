import { body } from 'express-validator';
import { validateResult } from '@/middleware/validationMiddleware';

export const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Must be a valid email'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('companyName').optional().trim(),
  body('licenseNumber').optional().trim(),
  validateResult,
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Must be a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validateResult,
];

export const requestOTPValidation = [
  body('type').isIn(['email', 'phone']).withMessage('Type must be "email" or "phone"'),
  validateResult,
];

export const otpValidation = [
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  validateResult,
];
