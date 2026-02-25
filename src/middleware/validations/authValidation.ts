import { body } from 'express-validator';
import { validateResult } from '@/middleware/validationMiddleware';

export const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validateResult,
];

export const loginValidation = [
  body('email').isEmail().withMessage('Must be a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validateResult,
];
