import express from 'express';
import { createMeeting, getMeetings, getMeetingDetail } from '@/controllers/meetingController';
import { authenticate } from '@/middleware/authMiddleware';
import { upload } from '@/middleware/uploadMiddleware';
import { createMeetingValidation, getMeetingDetailValidation } from '@/middleware/validations/meetingValidation';

const router = express.Router();

/**
 * @swagger
 * /api/meetings:
 *   post:
 *     summary: Process a new recorded meeting
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               fromSample:
 *                 type: string
 *                 enum: [yes, no]
 *                 description: If 'yes', use a random sample script instead of actual recording
 *               recording:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Meeting processed and intelligence extracted
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, upload.single('recording'), createMeetingValidation, createMeeting);

/**
 * @swagger
 * /api/meetings:
 *   get:
 *     summary: Get all meetings for current broker
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of meeting cards
 */
router.get('/', authenticate, getMeetings);

/**
 * @swagger
 * /api/meetings/get/{id}:
 *   get:
 *     summary: Get full deal intelligence sheet for a specific meeting
 *     tags: [Meetings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full meeting detail with all deal intelligence fields
 *       400:
 *         description: Invalid meeting ID format
 *       404:
 *         description: Meeting not found
 */
router.get('/get/:id', authenticate, getMeetingDetailValidation, getMeetingDetail);

export default router;
