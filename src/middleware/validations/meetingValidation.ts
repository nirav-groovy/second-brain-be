import { body, param } from 'express-validator';
import { validateResult } from '@/middleware/validationMiddleware';
import { Request, Response, NextFunction } from 'express';

export const createMeetingValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('fromSample').optional().isIn(['yes', 'no']).withMessage('fromSample must be yes or no'),
  // Custom check for req.file
  (req: Request, res: Response, next: NextFunction) => {
    const fromSample = req.body.fromSample === 'yes';
    if (!fromSample && !req.file) {
      return res.status(400).json({
        errors: [{ msg: 'Recording file is required when not using a sample', param: 'recording', location: 'file' }]
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
