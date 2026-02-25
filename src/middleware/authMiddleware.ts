import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || '';

export const authenticate = (req: any, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};
