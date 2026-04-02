import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { FinancialRecord } from '../src/models/FinancialRecord.js';

let adminToken;
let analystToken;
let viewerToken;

beforeAll(async () => {
  await connectDB();
  await User.deleteMany({});
  await FinancialRecord.deleteMany({});

  const adminRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Dash Admin', email: 'dashadmin@test.com', password: 'password123', role: 'admin',
  });
  adminToken = adminRes.body.data.token;

  const analystRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Dash Analyst', email: 'dashanalyst@test.com', password: 'password123', role: 'analyst',
  });
  analystToken = analystRes.body.data.token;

  const viewerRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Dash Viewer', email: 'dashviewer@test.com', password: 'password123', role: 'viewer',
  });
  viewerToken = viewerRes.body.data.token;

  const records = [
    { amount: 5000, type: 'income', category: 'salary', date: '2024-01-15' },
    { amount: 5000, type: 'income', category: 'salary', date: '2024-02-15' },
    { amount: 3000, type: 'income', category: 'freelance', date: '2024-03-10' },
    { amount: 200, type: 'expense', category: 'food', date: '2024-01-20' },
    { amount: 150, type: 'expense', category: 'transport', date: '2024-02-10' },
    { amount: 800, type: 'expense', category: 'rent', date: '2024-01-01' },
    { amount: 100, type: 'expense', category: 'entertainment', date: '2024-03-05' },
    { amount: 50, type: 'expense', category: 'utilities', date: '2024-03-15' },
    { amount: 2000, type: 'income', category: 'investment', date: '2024-04-01' },
    { amount: 300, type: 'expense', category: 'shopping', date: '2024-04-10' },
  ];

  for (const record of records) {
    await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(record);
  }
});

afterAll(async () => {
  await User.deleteMany({});
  await FinancialRecord.deleteMany({});
  await disconnectDB();
});

describe('Dashboard Endpoints', () => {
  describe('GET /api/v1/dashboard/overview', () => {
    it('admin should get overview summary', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.totalIncome).toBeDefined();
      expect(res.body.data.summary.totalExpenses).toBeDefined();
      expect(res.body.data.summary.netBalance).toBeDefined();
      expect(res.body.data.summary.totalRecords).toBe(10);
      expect(res.body.data.summary.totalIncome).toBe(15000);
      expect(res.body.data.summary.totalExpenses).toBe(1600);
      expect(res.body.data.summary.netBalance).toBe(13400);
    });

    it('viewer should be able to access overview', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
    });

    it('analyst should be able to access overview', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
    });

    it('should fail without authentication', async () => {
      const res = await request(app).get('/api/v1/dashboard/overview');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/dashboard/categories', () => {
    it('admin should get category breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.categories).toBeDefined();
      expect(Array.isArray(res.body.data.categories)).toBe(true);
      expect(res.body.data.categories.length).toBeGreaterThan(0);

      res.body.data.categories.forEach((cat) => {
        expect(cat.category).toBeDefined();
        expect(cat.grandTotal).toBeDefined();
        expect(cat.breakdown).toBeDefined();
      });
    });

    it('analyst should access category breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/categories')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
    });

    it('viewer should NOT access category breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/categories')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/dashboard/trends/monthly', () => {
    it('admin should get monthly trends', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/trends/monthly?year=2024')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.year).toBe(2024);
      expect(res.body.data.trends).toBeDefined();
      expect(res.body.data.trends.length).toBe(12);

      const jan = res.body.data.trends.find((t) => t.month === 1);
      expect(jan.income).toBeGreaterThan(0);
      expect(jan.expenses).toBeGreaterThan(0);
    });

    it('analyst should access monthly trends', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/trends/monthly')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
    });

    it('viewer should NOT access monthly trends', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/trends/monthly')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/dashboard/trends/weekly', () => {
    it('admin should get weekly trends', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/trends/weekly?weeks=52')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.trends).toBeDefined();
      expect(Array.isArray(res.body.data.trends)).toBe(true);
    });
  });

  describe('GET /api/v1/dashboard/recent', () => {
    it('should get recent activity', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/recent?limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records).toBeDefined();
      expect(res.body.data.records.length).toBeLessThanOrEqual(5);
    });

    it('viewer should be able to access recent activity', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/recent')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/dashboard/top-categories', () => {
    it('should get top expense categories', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/top-categories?limit=3&type=expense')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.categories).toBeDefined();
      expect(res.body.data.categories.length).toBeLessThanOrEqual(3);

      const totals = res.body.data.categories.map((c) => c.total);
      for (let i = 1; i < totals.length; i++) {
        expect(totals[i]).toBeLessThanOrEqual(totals[i - 1]);
      }
    });

    it('should get top income categories', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/top-categories?type=income')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('viewer should NOT access top categories', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/top-categories')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
