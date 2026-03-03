import express from 'express';

import { upload } from '@/middleware/uploadMiddleware';
import { authenticate } from '@/middleware/authMiddleware';
import {
    createMeetingValidation,
    getMeetingDetailValidation
} from '@/middleware/validations/meetingValidation';
import {
    createMeeting,
    getMeetings,
    getMeetingDetail,
    getCRMStats,
    regenerateMeetingIntelligence,
    deleteMeeting
} from '@/controllers/meetingController';

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
 *               - projectId
 *               - recording
 *             properties:
 *               title:
 *                 type: string
 *               projectId:
 *                 type: string
 *               recording:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Meeting processed
 */
router.post('/', authenticate, upload.single('recording'), createMeetingValidation, createMeeting);

/**
 * @swagger
 * /api/meetings:
 *   get:
 *     summary: Search and Filter Meetings (CRM View)
 *     tags: [Meetings, CRM]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search by title, client name, or transcript content
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [completed, failed, transcribe-generating, speakers-generating, intelligence-generating]
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [Buyer, Seller, General, Other]
 *       - name: projectId
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by Project ID
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [createdAt, dealProbabilityScore, title]
 *       - name: order
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Filtered list of meeting cards
 */
router.get('/', authenticate, getMeetings);

/**
 * @swagger
 * /api/meetings/stats:
 *   get:
 *     summary: Get high-level CRM stats for the broker
 *     tags: [CRM]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Broker CRM dashboard statistics
 */
router.get('/stats', authenticate, getCRMStats);

/**
 * @swagger
 * /api/meetings/get/{id}:
 *   get:
 *     summary: Get full deal intelligence sheet
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
 *         description: Full meeting detail
 */
router.get('/get/:id', authenticate, getMeetingDetailValidation, getMeetingDetail);

/**
 * @swagger
 * /api/meetings/regenerate/{id}:
 *   post:
 *     summary: Regenerate AI intelligence for an existing meeting
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
 *         description: Regeneration process started
 */
router.post('/regenerate/:id', authenticate, regenerateMeetingIntelligence);

/**
 * @swagger
 * /api/meetings/{id}:
 *   delete:
 *     summary: Delete a meeting and its associated recording file
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
 *         description: Meeting deleted successfully
 */
router.delete('/:id', authenticate, deleteMeeting);

export default router;
