const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('./setup/app');
const db = require('./setup/db');
const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/ProjectBank');

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

describe('Mentor Preferences Cascade Routes', () => {
  let leaderToken, mentor1Token, mentor2Token;
  let leaderId, teamCode, teamId;
  let proj1;

  beforeEach(async () => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const leader = await User.create({
      username: 'leaderstudent',
      email: 'leader@student.com',
      password: hashedPassword,
      name: 'Leader Student',
      phone: '1234567890',
      role: 'student',
      studentData: {
        rollNumber: '21CSABC123',
        batch: '2025',
        department: 'CS',
        year: 3
      }
    });
    leaderId = leader._id;

    const mentor1 = await User.create({
      username: 'mentor1',
      email: 'mentor1@email.com',
      password: hashedPassword,
      name: 'Mentor 1',
      phone: '1111111111',
      role: 'mentor',
      mentorData: { empNo: 'EMP1', department: 'CS', designation: 'Prof' }
    });

    const mentor2 = await User.create({
      username: 'mentor2',
      email: 'mentor2@email.com',
      password: hashedPassword,
      name: 'Mentor 2',
      phone: '2222222222',
      role: 'mentor',
      mentorData: { empNo: 'EMP2', department: 'CS', designation: 'Prof' }
    });

    proj1 = await Project.create({
      title: 'Proj1',
      description: 'Desc 1',
      category: 'Web',
      isApproved: true
    });

    // Login users
    const resLeader = await request(app).post('/api/auth/login').send({ username: 'leaderstudent', password: 'password123' });
    leaderToken = resLeader.headers['set-cookie'][0];

    const resM1 = await request(app).post('/api/auth/login').send({ username: 'mentor1', password: 'password123' });
    mentor1Token = resM1.headers['set-cookie'][0];

    const resM2 = await request(app).post('/api/auth/login').send({ username: 'mentor2', password: 'password123' });
    mentor2Token = resM2.headers['set-cookie'][0];

    // Leader creates team with 2 mentors
    const createRes = await request(app)
      .post('/api/common/create-team')
      .set('Cookie', leaderToken)
      .send({
        projectChoices: [proj1._id.toString()],
        mentorChoices: [mentor1._id.toString(), mentor2._id.toString()]
      });

    teamCode = createRes.body.team.code;
    teamId = createRes.body.team._id;
  });

  it('should cascade to the next mentor if rejected by the first one, then reach sentinel value if rejected by last', async () => {
    // 1. Initially, currentPreference is 0 (first mentor)
    let team = await Team.findById(teamId);
    expect(team.mentor.currentPreference).toBe(0);

    // 2. Mentor 1 rejects
    const rejectRes1 = await request(app)
      .post('/api/common/reject-team')
      .set('Cookie', mentor1Token)
      .send({ teamId: teamId.toString() });

    expect(rejectRes1.status).toBe(200);

    // 3. currentPreference should be 1 now
    team = await Team.findById(teamId);
    expect(team.mentor.currentPreference).toBe(1);

    // 4. Mentor 2 rejects
    const rejectRes2 = await request(app)
      .post('/api/common/reject-team')
      .set('Cookie', mentor2Token)
      .send({ teamId: teamId.toString() });

    expect(rejectRes2.status).toBe(200);

    // 5. currentPreference should be -1 (sentinel)
    team = await Team.findById(teamId);
    expect(team.mentor.currentPreference).toBe(-1);
  });
});
