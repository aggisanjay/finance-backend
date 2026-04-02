import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { User } from '../src/models/User.js';

let adminToken;
let viewerToken;

beforeAll(async () => {
  await connectDB();
  await User.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({});
  await disconnectDB();
});

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new admin user', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Test Admin',
        email: 'testadmin@test.com',
        password: 'password123',
        role: 'admin',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('testadmin@test.com');
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();

      adminToken = res.body.data.token;
    });

    it('should register a viewer user', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Test Viewer',
        email: 'testviewer@test.com',
        password: 'password123',
        role: 'viewer',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('viewer');

      viewerToken = res.body.data.token;
    });

    it('should fail with duplicate email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Duplicate User',
        email: 'testadmin@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'incomplete@test.com',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should fail with invalid email format', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Bad Email',
        email: 'not-an-email',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with short password', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Short Pass',
        email: 'shortpass@test.com',
        password: '123',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'testadmin@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('testadmin@test.com');
    });

    it('should fail with wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'testadmin@test.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('testadmin@test.com');
    });

    it('should fail without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/auth/change-password', () => {
    it('should change password successfully', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();

      adminToken = res.body.data.token;
    });

    it('should fail with wrong current password', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'anotherpassword',
        });

      expect(res.status).toBe(400);
    });

    it('should login with new password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'testadmin@test.com',
        password: 'newpassword123',
      });

      expect(res.status).toBe(200);
      adminToken = res.body.data.token;
    });
  });
});
