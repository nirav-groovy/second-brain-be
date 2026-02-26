import express from 'express';
import { 
  register, 
  login, 
  verifyEmail, 
  verifyPhone, 
  requestOTP 
} from '@/controllers/authController';
import { authenticate } from '@/middleware/authMiddleware';
import { 
  registerValidation, 
  loginValidation, 
  otpValidation,
  requestOTPValidation
} from '@/middleware/validations/authValidation';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new broker
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               companyName:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/register', registerValidation, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate a broker
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Returns JWT and user info
 *       400:
 *         description: Validation error or invalid credentials
 */
router.post('/login', loginValidation, login);

/**
 * @swagger
 * /api/auth/request-otp:
 *   post:
 *     summary: Request an OTP for email or phone verification
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [email, phone]
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid type or already verified
 *       401:
 *         description: Unauthorized
 */
router.post('/request-otp', authenticate, requestOTPValidation, requestOTP);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email using OTP
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       401:
 *         description: Unauthorized
 */
router.post('/verify-email', authenticate, otpValidation, verifyEmail);

/**
 * @swagger
 * /api/auth/verify-phone:
 *   post:
 *     summary: Verify phone using OTP
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Phone verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       401:
 *         description: Unauthorized
 */
router.post('/verify-phone', authenticate, otpValidation, verifyPhone);

export default router;
