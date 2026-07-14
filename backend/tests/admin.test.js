const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('./setup/app');
const db = require('./setup/db');
const User = require('../models/User');

process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRE = '1d';

// We need to mount the admin route for testing /register
const express = require('express');
const cookieParser = require('cookie-parser');
const admin = require('../routes/admin');
const testApp = express();
testApp.use(express.json());
testApp.use(cookieParser());
testApp.use('/api/admin', admin);

beforeAll(async () => {
  await db.connect();
});

afterEach(async () => {
  await db.clearDatabase();
});

afterAll(async () => {
  await db.closeDatabase();
});

describe('Admin Routes (Signup/Register)', () => {
  let adminToken;

  beforeEach(async () => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create an admin user to get the token
    const adminUser = await User.create({
      username: 'adminuser',
      email: 'admin@system.com',
      password: hashedPassword,
      name: 'System Admin',
      phone: '9999999999',
      role: 'admin',
      adminData: {
        empNo: 'EMP001',
        department: 'System',
        designation: 'Admin'
      }
    });

    const jwt = require('jsonwebtoken');
    adminToken = jwt.sign({ _id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  it('should register a new student user via /api/admin/register', async () => {
    const res = await request(testApp)
      .post('/api/admin/register')
      .set('Cookie', `token=${adminToken}`)
      .send({
        name: 'New Student',
        username: 'newstudent',
        email: 'newstudent@student.com',
        phone: '1234567891',
        role: 'student',
        studentData: {
          rollNumber: '21CSABC125',
          batch: '2025',
          department: 'CS',
          year: 3
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User registered successfully');

    // Verify user exists in db
    const userInDb = await User.findOne({ username: 'newstudent' });
    expect(userInDb).not.toBeNull();
    expect(userInDb.role).toBe('student');
  });
});
