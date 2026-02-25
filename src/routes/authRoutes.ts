import express from 'express';
import { register, login } from '@/controllers/authController';
import { registerValidation, loginValidation } from '@/middleware/validations/authValidation';

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
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
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
export default router;
