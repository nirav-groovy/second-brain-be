import ErrorLog from '@/models/ErrorLog';
import { ErrorContext } from '@/types/enums';

const SENSITIVE_FIELDS = ['password', 'token', 'otp', 'apiKey', 'api_key', 'authorization'];

const sanitizeData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };
  for (const key in sanitized) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }
  return sanitized;
};

export const logError = async (error: any, context: ErrorContext) => {
  try {
    // Construct base object
    const errorData: any = {
      source: context.source,
      level: context.level || 'ERROR',
      message: error.message || 'Unknown error',
      name: error.name || 'Error',
      timestamp: new Date()
    };

    // Only add optional fields if they are defined to avoid Mongoose/TS exactOptionalPropertyTypes errors
    if (context.userId) errorData.userId = context.userId;
    if (context.functionName) errorData.functionName = context.functionName;
    if (error.stack) errorData.stack = error.stack;
    if (context.endpoint) errorData.endpoint = context.endpoint;
    if (context.method) errorData.method = context.method;
    if (context.requestBody) errorData.requestBody = sanitizeData(context.requestBody);
    if (context.queryParams) errorData.queryParams = sanitizeData(context.queryParams);
    if (context.context) errorData.context = sanitizeData(context.context);
    if (context.ipAddress) errorData.ipAddress = context.ipAddress;

    // Log to console for real-time visibility
    const origin = context.functionName ? `[${context.functionName}]` : '';
    console.error(`[${errorData.level}] ${errorData.source}${origin}: ${errorData.message}`);

    // Save to MongoDB
    await ErrorLog.create(errorData);
  } catch (loggingError) {
    // If DB logging fails, at least print both errors to console
    console.error('CRITICAL: Failed to log error to database:', loggingError);
    console.error('Original Error:', error);
  }
};
