import fs from 'fs';
import path from 'path';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app';
import Meeting from '../models/Meeting';
import { MeetingStatus } from '../types/enums';
import { initializeDatabase } from '../utils/initDb';

let mongoServer: MongoMemoryServer;

// Mock Services
jest.mock('../services/sttService', () => ({
  transcribeAudio: jest.fn().mockResolvedValue({
    diarized_transcript: { entries: [{ speaker: '0', text: 'Hello, this is a test.' }] }
  }),
}));

jest.mock('../services/dealIntelligenceService', () => ({
  identifySpeakers: jest.fn().mockResolvedValue('Speaker 0 (Broker): Hello, this is a test.'),
  extractDealIntelligence: jest.fn().mockResolvedValue({
    ai_response: {
      summary: 'Test summary',
      conversationType: 'Buyer',
      dealProbabilityScore: 85
    },
    long_transcript: false
  }),
}));

jest.mock('../services/calendarService', () => ({
  scheduleFollowUp: jest.fn().mockResolvedValue({ eventDate: new Date() }),
}));

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await initializeDatabase();

  // Create a dummy audio file for testing
  const dummyAudioPath = path.join(__dirname, 'test-audio.mp3');
  fs.writeFileSync(dummyAudioPath, 'dummy-audio-content');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();

  // Cleanup dummy audio file
  const dummyAudioPath = path.join(__dirname, 'test-audio.mp3');
  if (fs.existsSync(dummyAudioPath)) {
    fs.unlinkSync(dummyAudioPath);
  }
});

describe('Meeting API - Comprehensive Security, Validation & Business Logic', () => {
  let token: string;
  let userId: string;
  let projectId: string;
  const dummyAudioPath = path.join(__dirname, 'test-audio.mp3');

  beforeAll(async () => {
    const email = `meeting-tester-${Date.now()}@example.com`;
    // Register & Login to get token
    await request(app).post('/api/auth/register').send({
      firstName: 'Meeting',
      lastName: 'Tester',
      email: email,
      phone: '9000000000',
      password: 'password123'
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: email,
      password: 'password123',
    });

    token = loginRes.body.data?.token || "";
    userId = loginRes.body.data?.user.id || "";

    // Create a test project
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project' });
    projectId = projectRes.body.data?._id || "";
  });

  describe('POST /api/meetings', () => {
    it('should fail to create a meeting without authentication', async () => {
      const res = await request(app).post('/api/meetings').send({ title: 'Unauthorized', projectId });
      expect(res.status).toBe(401);
    });

    it('should successfully create a meeting with a real audio file', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .attach('recording', dummyAudioPath)
        .field('title', 'Audio Test')
        .field('projectId', projectId);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(MeetingStatus.TRANSCRIBE_GENERATING);
      expect(res.body.data.projectId).toBe(projectId);
    });

    it('should fail to create a meeting without a title', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .attach('recording', dummyAudioPath)
        .field('projectId', projectId);

      expect(res.status).toBe(400);
      expect(res.body.errors.find((e: any) => e.msg === 'Title is required')).toBeDefined();
    });

    it('should successfully create a meeting without a projectId (attaches to Unnamed Project)', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .attach('recording', dummyAudioPath)
        .field('title', 'Unnamed Project Test');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projectId).toBeDefined();
      
      const meeting = await Meeting.findById(res.body.data._id).populate('projectId');
      expect((meeting?.projectId as any).name).toBe('Unnamed Project');
    });

    it('should fail if projectId format is invalid', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .attach('recording', dummyAudioPath)
        .field('title', 'Invalid Project Test')
        .field('projectId', 'invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.errors.find((e: any) => e.msg === 'Invalid projectId format')).toBeDefined();
    });

    it('should fail if recording file is missing', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'No Audio Test');

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('Recording file is required');
    });

    it('should enforce the 5 meeting limit for unverified accounts', async () => {
      // Create 4 more meetings (1 already created above)
      for (let i = 0; i < 4; i++) {
        await Meeting.create({
          brokerId: userId,
          projectId,
          title: `Pre-limit Meeting ${i}`,
          status: MeetingStatus.COMPLETED
        });
      }

      // Now try the 6th meeting
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .attach('recording', dummyAudioPath)
        .field('title', 'Limit Breaker')
        .field('projectId', projectId);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Meeting limit reached');
    });
  });

  describe('GET /api/meetings', () => {
    it('should list all meetings for the authenticated broker', async () => {
      const res = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should not show meetings belonging to other brokers', async () => {
      // Create another user
      const otherEmail = `other-${Date.now()}@example.com`;
      await request(app).post('/api/auth/register').send({
        firstName: 'Other', lastName: 'User', email: otherEmail, phone: `p-${Date.now()}`, password: 'password123'
      });
      const otherLoginRes = await request(app).post('/api/auth/login').send({
        email: otherEmail, password: 'password123'
      });
      const otherToken = otherLoginRes.body.data?.token || "";

      // Create project for other broker
      const otherProjectRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Other Project' });
      const otherProjectId = otherProjectRes.body.data?._id || "";

      const res = await request(app)
        .get(`/api/meetings?projectId=${otherProjectId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('GET /api/meetings/get/:id', () => {
    let meetingId: string;

    beforeAll(async () => {
      const meeting = await Meeting.findOne({ brokerId: userId });
      meetingId = meeting?.id.toString() || '';
    });

    it('should fetch details for a valid meeting ID', async () => {
      const res = await request(app)
        .get(`/api/meetings/get/${meetingId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBeDefined();
    });

    it('should fail with a 404 for a non-existent meeting ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/meetings/get/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Meeting not found');
    });

    it('should fail with a 400 for an invalid ID format', async () => {
      const res = await request(app)
        .get('/api/meetings/get/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('Invalid meeting ID format');
    });
  });
});
