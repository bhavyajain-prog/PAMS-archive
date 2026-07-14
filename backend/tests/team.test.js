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

describe('Team Routes', () => {
  let leaderToken;
  let leaderId;
  let memberToken;

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

    const member = await User.create({
      username: 'memberstudent',
      email: 'member@student.com',
      password: hashedPassword,
      name: 'Member Student',
      phone: '0987654321',
      role: 'student',
      studentData: {
        rollNumber: '21CSABC124',
        batch: '2025',
        department: 'CS',
        year: 3
      }
    });

    const mentor1 = await User.create({
      username: 'mentor1',
      email: 'mentor1@email.com',
      password: hashedPassword,
      name: 'Mentor 1',
      phone: '1111111111',
      role: 'mentor',
      mentorData: {
        empNo: 'EMP123',
        department: 'CS',
        designation: 'Prof'
      }
    });

    const proj1 = await Project.create({
      title: 'Proj1',
      description: 'Desc 1',
      category: 'Web',
      isApproved: true
    });

    const proj2 = await Project.create({
      title: 'Proj2',
      description: 'Desc 2',
      category: 'Mobile',
      isApproved: true
    });

    leaderId = leader._id;

    // Login leader
    const resLeader = await request(app)
      .post('/api/auth/login')
      .send({ username: 'leaderstudent', password: 'password123' });
    leaderToken = resLeader.headers['set-cookie'][0];

    // Login member
    const resMember = await request(app)
      .post('/api/auth/login')
      .send({ username: 'memberstudent', password: 'password123' });
    memberToken = resMember.headers['set-cookie'][0];
  });

  it('should create a team and then a member can join with code', async () => {
    const mentor = await User.findOne({ username: 'mentor1' });
    const proj1 = await Project.findOne({ title: 'Proj1' });
    const proj2 = await Project.findOne({ title: 'Proj2' });

    // 1. Leader creates a team
    const createRes = await request(app)
      .post('/api/common/create-team')
      .set('Cookie', leaderToken)
      .send({
        projectChoices: [proj1._id.toString(), proj2._id.toString()],
        mentorChoices: [mentor._id.toString()]
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.team.leader.toString()).toBe(leaderId.toString());
    const teamCode = createRes.body.team.code;
    expect(teamCode).toHaveLength(6);

    // 2. Member joins with code
    const joinRes = await request(app)
      .post('/api/common/join-team')
      .set('Cookie', memberToken)
      .send({ code: teamCode });

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.message).toBe('You have joined the team successfully.');

    // 3. Verify member in team
    const updatedTeam = await Team.findOne({ code: teamCode });
    expect(updatedTeam.members).toHaveLength(1);
    expect(updatedTeam.members[0].student.toString()).toBe((await User.findOne({username: 'memberstudent'}))._id.toString());
  });
});
