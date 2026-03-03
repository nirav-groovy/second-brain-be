import { Response, NextFunction } from 'express';
import { UserRole } from '@/types/enums';

export const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === UserRole.ADMIN) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin role required.'
  });
};
