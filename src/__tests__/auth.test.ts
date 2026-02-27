import app from '../app';
import request from 'supertest';
import mongoose from 'mongoose';
import User from '../models/User';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

// Mock External Services
jest.mock('../services/emailService', () => ({
  sendEmailOTP: jest.fn().mockResolvedValue(true),
}));

jest.mock('../services/smsService', () => ({
  sendSMSOTP: jest.fn().mockResolvedValue(true),
}));

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Authentication API - Comprehensive Security & Validation', () => {
  const testUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '9876543210',
    password: 'securePassword123',
  };

  describe('POST /api/auth/register', () => {
    it('should successfully register a new broker', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('User registered successfully');
    });

    it('should fail if email is already taken', async () => {
      const res = await request(app).post('/api/auth/register').send({
        ...testUser,
        phone: '1112223333'
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already exists');
    });

    it('should fail if phone number is already taken', async () => {
      const res = await request(app).post('/api/auth/register').send({
        ...testUser,
        email: 'another@example.com'
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Phone number already exists');
    });

    it('should fail if password is too short (min 6 chars)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        ...testUser,
        email: 'short@example.com',
        phone: '0000000000',
        password: '123'
      });
      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('Password must be at least 6 characters long');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login an existing broker', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      console.log(`🚀 ~ auth.test.ts:84 ~ res:`, res);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should fail to login with non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'ghost@example.com',
        password: 'anyPassword',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should fail to login with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'wrongPassword',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('OTP Lifecycle & Security', () => {
    let token: string;

    beforeAll(async () => {
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      console.log(`🚀 ~ auth.test.ts:117 ~ loginRes:`, loginRes);
      token = loginRes.body.data.token;
    });

    it('should fail to request OTP without authentication header', async () => {
      const res = await request(app).post('/api/auth/request-otp').send({ type: 'email' });
      expect(res.status).toBe(401);
    });

    it('should fail if OTP type is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/request-otp')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'fax' });
      expect(res.status).toBe(400);
    });

    it('should successfully request an email OTP', async () => {
      const res = await request(app)
        .post('/api/auth/request-otp')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'email' });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('OTP sent to your email');
    });

    it('should fail to verify email with an incorrect OTP format', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .set('Authorization', `Bearer ${token}`)
        .send({ otp: '123' }); // Too short
      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe('OTP must be 6 digits');
    });

    it('should fail to verify email with a wrong 6-digit OTP', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .set('Authorization', `Bearer ${token}`)
        .send({ otp: '000000' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid or expired OTP');
    });

    it('should successfully verify email with the correct OTP', async () => {
      const user = await User.findOne({ email: testUser.email });
      const otp = user?.emailOTP;

      const res = await request(app)
        .post('/api/auth/verify-email')
        .set('Authorization', `Bearer ${token}`)
        .send({ otp });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Email verified successfully');

      const updatedUser = await User.findOne({ email: testUser.email });
      expect(updatedUser?.emailVerified).toBe(true);
    });

    it('should fail to request OTP if email is already verified', async () => {
      const res = await request(app)
        .post('/api/auth/request-otp')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'email' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email already verified');
    });
  });
});
