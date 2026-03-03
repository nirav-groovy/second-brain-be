import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateResult = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map(error => error.msg).join(', '),
      errors: errors.array()
    });
  }
  return next();
};
