const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('./setup/app');
const db = require('./setup/db');
const User = require('../models/User');

process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRE = '1d';

beforeAll(async () => {
  await db.connect();
});

afterEach(async () => {
  await db.clearDatabase();
});

afterAll(async () => {
  await db.closeDatabase();
});

describe('Auth Routes', () => {
  let user;

  beforeEach(async () => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    user = await User.create({
      username: 'teststudent',
      email: 'test@student.com',
      password: hashedPassword,
      name: 'Test Student',
      phone: '1234567890',
      role: 'student',
      studentData: {
        rollNumber: '21CSABC123',
        batch: '2025',
        department: 'CS',
        year: 3
      }
    });
  });

  it('should login a user and return a cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'teststudent',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('teststudent');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'teststudent',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
  });

  it('should logout a user and clear cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/token=;/);
  });
});
