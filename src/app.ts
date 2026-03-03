import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import express from 'express';
import { specs } from '@/config/swagger';
import swaggerUi from 'swagger-ui-express';
import authRoutes from '@/routes/authRoutes';
import meetingRoutes from '@/routes/meetingRoutes';
import projectRoutes from '@/routes/projectRoutes';
import { globalErrorHandler } from '@/middleware/errorMiddleware';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/projects', projectRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('AI Meeting Memory API is running');
});

// Multer and custom errors handling before global handler if needed
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        errors: [{ msg: `Unexpected field: ${err.field}. Please use 'recording' field for the audio file.`, param: err.field, location: 'file' }]
      });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err.message === 'Only audio files are allowed!') {
    return res.status(400).json({
      errors: [{ msg: err.message, param: 'recording', location: 'file' }]
    });
  }

  return next(err);
});

// Global Error Handler (Centralized Logging)
app.use(globalErrorHandler);

export default app;
