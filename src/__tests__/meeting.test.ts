import fs from 'fs';
import path from 'path';
import app from '../app';
import request from 'supertest';
import mongoose from 'mongoose';
import Meeting from '../models/Meeting';
import { MongoMemoryServer } from 'mongodb-memory-server';

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
    promptUsed: 'nirav'
  }),
}));

jest.mock('../services/calendarService', () => ({
  scheduleFollowUp: jest.fn().mockResolvedValue({ eventDate: new Date() }),
}));

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

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

describe('Meeting API - Security, Validation & Business Logic', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const email = 'meeting-tester@example.com';
    // Register & Login to get token
    await request(app).post('/api/auth/register').send({
      firstName: 'Meeting',
      lastName: 'Tester',
      email: email,
      phone: '9000000000',
      password: 'password123',
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: email,
      password: 'password123',
    });

    token = loginRes.body.data.token;
    userId = loginRes.body.data.user.id;
  });

  describe('POST /api/meetings', () => {
    it('should fail to create a meeting without authentication', async () => {
      const res = await request(app).post('/api/meetings').send({ title: 'Unauthorized' });
      expect(res.status).toBe(401);
    });

    it('should successfully create a meeting using a sample script', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Sample Test',
          fromSample: 'yes',
          usePrompt: 'pankaj'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('transcribe-generating');
    });

    it('should successfully create a meeting with a real audio file', async () => {
      const dummyAudioPath = path.join(__dirname, 'test-audio.mp3');
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .attach('recording', dummyAudioPath)
        .field('title', 'Audio Test')
        .field('fromSample', 'no');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should fail to create a meeting without a title', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({ fromSample: 'yes' });
      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('Title is required');
    });

    it('should fail if neither sample nor recording is provided', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'No Audio Test')
        .field('fromSample', 'no');

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('Recording file is required when not using a sample');
    });

    it('should fail if file is not an audio file', async () => {
      const dummyFilePath = path.join(__dirname, 'test.txt');
      fs.writeFileSync(dummyFilePath, 'not an audio');

      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .attach('recording', dummyFilePath)
        .field('title', 'Wrong File Type')
        .field('fromSample', 'no');

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('Only audio files are allowed!');

      fs.unlinkSync(dummyFilePath);
    });

    it('should enforce the 5 meeting limit for unverified accounts', async () => {
      // Current count: 2 (from previous tests). Add 3 more.
      for (let i = 0; i < 3; i++) {
        await Meeting.create({
          brokerId: userId,
          title: `Pre-limit Meeting ${i}`,
          promptUsed: 'nirav',
          status: 'completed'
        });
      }

      // Now try the 6th meeting
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Limit Breaker', fromSample: 'yes' });

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
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });

    it('should not show meetings belonging to other brokers', async () => {
      // Create another user
      const otherUserRes = await request(app).post('/api/auth/register').send({
        firstName: 'Other', lastName: 'User', email: 'other@example.com', phone: '0000000001', password: 'password123'
      });
      const otherLoginRes = await request(app).post('/api/auth/login').send({
        email: 'other@example.com', password: 'password123'
      });
      const otherToken = otherLoginRes.body.data.token;

      const res = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0); // Should be empty
    });
  });

  describe('GET /api/meetings/get/:id', () => {
    let meetingId: string;

    beforeAll(async () => {
      const meeting = await Meeting.findOne({ brokerId: userId });
      meetingId = meeting?._id.toString() || '';
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
        .get('/api/meetings/get/123-abc')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('Invalid meeting ID format');
    });

    it('should fail if a broker tries to access another broker\'s meeting', async () => {
      // Get other broker token
      const otherLoginRes = await request(app).post('/api/auth/login').send({
        email: 'other@example.com', password: 'password123'
      });
      const otherToken = otherLoginRes.body.data.token;

      const res = await request(app)
        .get(`/api/meetings/get/${meetingId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(404); // Should return 404 for security (not revealing it exists)
    });
  });
});
