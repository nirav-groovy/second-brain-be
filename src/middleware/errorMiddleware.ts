import { logError } from '@/utils/logger';
import { ErrorContext } from '@/types/enums';
import { Request, Response, NextFunction } from 'express';

export const globalErrorHandler = async (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract context from request
  const context: ErrorContext = {
    userId: (req as any).user?.id,
    source: 'API' as const,
    endpoint: req.originalUrl,
    method: req.method,
    requestBody: req.body,
    queryParams: req.query,
    ipAddress: req.ip,
  };

  // Log to database
  await logError(error, context);

  // Send clean response to client
  const statusCode = error.status || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'An unexpected internal server error occurred.' : error.message,
    // Include stack trace only in development
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};
