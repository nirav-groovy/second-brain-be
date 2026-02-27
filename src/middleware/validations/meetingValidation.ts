import { body, param } from 'express-validator';
import { validateResult } from '@/middleware/validationMiddleware';
import { Request, Response, NextFunction } from 'express';

export const createMeetingValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  // Custom check for req.file
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(400).json({
        errors: [{ msg: 'Recording file is required', param: 'recording', location: 'file' }]
      });
    }
    return next();
  },
  validateResult,
];

export const getMeetingDetailValidation = [
  param('id').isMongoId().withMessage('Invalid meeting ID format'),
  validateResult,
];
