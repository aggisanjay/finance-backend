import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { FinancialRecord } from '../src/models/FinancialRecord.js';

let adminToken;
let analystToken;
let viewerToken;
let createdRecordId;

beforeAll(async () => {
  await connectDB();
  await User.deleteMany({});
  await FinancialRecord.deleteMany({});

  const adminRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Record Admin', email: 'recordadmin@test.com', password: 'password123', role: 'admin',
  });
  adminToken = adminRes.body.data.token;

  const analystRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Record Analyst', email: 'recordanalyst@test.com', password: 'password123', role: 'analyst',
  });
  analystToken = analystRes.body.data.token;

  const viewerRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Record Viewer', email: 'recordviewer@test.com', password: 'password123', role: 'viewer',
  });
  viewerToken = viewerRes.body.data.token;
});

afterAll(async () => {
  await User.deleteMany({});
  await FinancialRecord.deleteMany({});
  await disconnectDB();
});

describe('Financial Records Endpoints', () => {
  describe('POST /api/v1/records', () => {
    it('admin should create a record successfully', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 5000, type: 'income', category: 'salary', date: '2024-06-15', description: 'Monthly salary for June' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.record.amount).toBe(5000);
      expect(res.body.data.record.type).toBe('income');
      expect(res.body.data.record.category).toBe('salary');

      createdRecordId = res.body.data.record._id;
    });

    it('admin should create an expense record', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 150.5, type: 'expense', category: 'food', date: '2024-06-16', description: 'Grocery shopping' });

      expect(res.status).toBe(201);
      expect(res.body.data.record.type).toBe('expense');
    });

    it('should create multiple records for filtering tests', async () => {
      const records = [
        { amount: 200, type: 'expense', category: 'transport', date: '2024-05-10', description: 'Uber rides' },
        { amount: 3000, type: 'income', category: 'freelance', date: '2024-05-15', description: 'Web project' },
        { amount: 80, type: 'expense', category: 'entertainment', date: '2024-07-01', description: 'Movie night' },
        { amount: 1200, type: 'income', category: 'investment', date: '2024-07-10', description: 'Dividends' },
        { amount: 500, type: 'expense', category: 'utilities', date: '2024-06-20', description: 'Electricity bill' },
      ];

      for (const record of records) {
        const res = await request(app)
          .post('/api/v1/records')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(record);
        expect(res.status).toBe(201);
      }
    });

    it('viewer should NOT be able to create records', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ amount: 100, type: 'expense', category: 'food', description: 'Unauthorized attempt' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('analyst should NOT be able to create records', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ amount: 100, type: 'expense', category: 'food' });

      expect(res.status).toBe(403);
    });

    it('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Missing amount and type' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should fail with invalid type', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 100, type: 'invalid_type', category: 'food' });

      expect(res.status).toBe(400);
    });

    it('should fail with negative amount', async () => {
      const res = await request(app)
        .post('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: -50, type: 'expense', category: 'food' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/records', () => {
    it('admin should get all records with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records).toBeDefined();
      expect(Array.isArray(res.body.data.records)).toBe(true);
      expect(res.body.meta.pagination).toBeDefined();
      expect(res.body.meta.pagination.total).toBeGreaterThan(0);
    });

    it('viewer should be able to read records', async () => {
      const res = await request(app)
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records).toBeDefined();
    });

    it('analyst should be able to read records', async () => {
      const res = await request(app)
        .get('/api/v1/records')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
    });

    it('should filter records by type', async () => {
      const res = await request(app)
        .get('/api/v1/records?type=income')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.records.forEach((record) => {
        expect(record.type).toBe('income');
      });
    });

    it('should filter records by category', async () => {
      const res = await request(app)
        .get('/api/v1/records?category=food')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.records.forEach((record) => {
        expect(record.category).toBe('food');
      });
    });

    it('should filter records by date range', async () => {
      const res = await request(app)
        .get('/api/v1/records?startDate=2024-06-01&endDate=2024-06-30')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.records.forEach((record) => {
        const recordDate = new Date(record.date);
        expect(recordDate >= new Date('2024-06-01')).toBe(true);
        expect(recordDate <= new Date('2024-06-30')).toBe(true);
      });
    });

    it('should filter records by amount range', async () => {
      const res = await request(app)
        .get('/api/v1/records?minAmount=100&maxAmount=1000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.records.forEach((record) => {
        expect(record.amount).toBeGreaterThanOrEqual(100);
        expect(record.amount).toBeLessThanOrEqual(1000);
      });
    });

    it('should search records by description', async () => {
      const res = await request(app)
        .get('/api/v1/records?search=salary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records.length).toBeGreaterThan(0);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/v1/records?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records.length).toBeLessThanOrEqual(2);
      expect(res.body.meta.pagination.limit).toBe(2);
    });

    it('should sort records by amount ascending', async () => {
      const res = await request(app)
        .get('/api/v1/records?sortBy=amount&sortOrder=asc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const amounts = res.body.data.records.map((r) => r.amount);
      for (let i = 1; i < amounts.length; i++) {
        expect(amounts[i]).toBeGreaterThanOrEqual(amounts[i - 1]);
      }
    });
  });

  describe('GET /api/v1/records/:id', () => {
    it('should get a single record by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/records/${createdRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.record._id).toBe(createdRecordId);
    });

    it('should return 404 for non-existent record', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/records/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ID format', async () => {
      const res = await request(app)
        .get('/api/v1/records/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/records/:id', () => {
    it('admin should update a record', async () => {
      const res = await request(app)
        .patch(`/api/v1/records/${createdRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 5500, description: 'Updated monthly salary' });

      expect(res.status).toBe(200);
      expect(res.body.data.record.amount).toBe(5500);
      expect(res.body.data.record.description).toBe('Updated monthly salary');
    });

    it('viewer should NOT update records', async () => {
      const res = await request(app)
        .patch(`/api/v1/records/${createdRecordId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ amount: 9999 });

      expect(res.status).toBe(403);
    });

    it('analyst should NOT update records', async () => {
      const res = await request(app)
        .patch(`/api/v1/records/${createdRecordId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ amount: 9999 });

      expect(res.status).toBe(403);
    });

    it('should fail with empty update body', async () => {
      const res = await request(app)
        .patch(`/api/v1/records/${createdRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/records/:id', () => {
    it('viewer should NOT delete records', async () => {
      const res = await request(app)
        .delete(`/api/v1/records/${createdRecordId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it('admin should soft-delete a record', async () => {
      const res = await request(app)
        .delete(`/api/v1/records/${createdRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('deleted record should not appear in listing', async () => {
      const res = await request(app)
        .get(`/api/v1/records/${createdRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
