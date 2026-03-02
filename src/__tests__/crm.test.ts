import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app';
import Meeting from '../models/Meeting';
import { initializeDatabase } from '../utils/initDb';
import { MeetingStatus } from '../types/enums';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await initializeDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('CRM Search & Filtering API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    // 1. Create and Login User
    const email = `crm-tester-${Date.now()}@example.com`; // Ensure unique email for each test run
    const phone = `111222${Date.now()}`;

    const registerRes = await request(app).post('/api/auth/register').send({
      firstName: 'CRM', lastName: 'Tester', email, phone, password: 'password123'
    });

    // Expect registration to be successful
    if (registerRes.status !== 201) {
      throw new Error(`Registration failed in beforeAll: ${JSON.stringify(registerRes.body)}`);
    }

    const loginRes = await request(app).post('/api/auth/login').send({
      email, password: 'password123'
    });

    // Check if login was successful before proceeding
    if (loginRes.status !== 200) {
      throw new Error(`Login failed in beforeAll: ${JSON.stringify(loginRes.body)}`);
    }

    token = loginRes.body.data?.token || "";
    userId = loginRes.body.data?.user.id || "";


    // 2. Seed Mock Meetings
    await Meeting.create([
      {
        brokerId: userId,
        title: 'Meeting with Mr. Patel',
        clientName: 'Mister Patel',
        conversationType: 'Seller',
        dealProbabilityScore: 90,
        status: MeetingStatus.COMPLETED,
        transcript: 'I want to sell my property in Satellite area.'
      },
      {
        brokerId: userId,
        title: 'High interest 3BHK',
        clientName: 'Nirav',
        conversationType: 'Buyer',
        dealProbabilityScore: 85,
        status: MeetingStatus.COMPLETED,
        transcript: 'Looking for a flat in Shela.'
      },
      {
        brokerId: userId,
        title: 'Initial Inquiry',
        clientName: 'Anjali',
        conversationType: 'Buyer',
        dealProbabilityScore: 40,
        status: MeetingStatus.COMPLETED,
        transcript: 'Just asking about prices.'
      },
      {
        brokerId: userId,
        title: 'Failed Recording',
        status: MeetingStatus.FAILED,
      }
    ]);
  });

  it('should search by client name', async () => {
    const res = await request(app)
      .get('/api/meetings?search=Patel')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].clientName).toBe('Mister Patel');
  });

  it('should search by transcript content', async () => {
    const res = await request(app)
      .get('/api/meetings?search=Shela')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].title).toBe('High interest 3BHK');
  });

  it('should filter by conversation type (Buyer)', async () => {
    const res = await request(app)
      .get('/api/meetings?type=Buyer')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.data.every((m: any) => m.conversationType === 'Buyer')).toBe(true);
  });

  it('should filter by status', async () => {
    const res = await request(app)
      .get(`/api/meetings?status=${MeetingStatus.FAILED}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].status).toBe(MeetingStatus.FAILED);
  });

  it('should sort by deal probability (desc)', async () => {
    const res = await request(app)
      .get('/api/meetings?sortBy=dealProbabilityScore&order=desc')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].dealProbabilityScore).toBe(90);
    expect(res.body.data[1].dealProbabilityScore).toBe(85);
  });

  it('should calculate CRM stats correctly', async () => {
    const res = await request(app)
      .get('/api/meetings/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalDeals).toBe(3); // 3 completed ones
    expect(res.body.data.buyers).toBe(2);
    expect(res.body.data.sellers).toBe(1);
    expect(res.body.data.highProbabilityDeals).toBe(2); // 90 and 85
    expect(res.body.data.avgProbability).toBeCloseTo((90 + 85 + 40) / 3);
  });
});
