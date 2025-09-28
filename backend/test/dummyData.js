/**
 * Dummy Data Generator for PAMS Database Testing
 *
 * This script populates the database with realistic test data for development and testing.
 *
 * To run this script:
 * 1. Make sure your MongoDB is running and MONGO_URI is set in environment
 * 2. Run: node test/dummyData.js
 *
 * This will create:
 * - Default admin and dev users
 * - Sample students, mentors, and sub-admins
 * - Sample teams with proper relationships
 * - Sample project bank entries
 * - Sample project abstracts and role specifications
 * - Sample weekly status updates
 * - System settings
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import all models
const User = require("../models/User");
const Team = require("../models/Team");
const ProjectBank = require("../models/ProjectBank");
const SystemSettings = require("../models/SystemSettings");

// Sample data configurations
const SAMPLE_DATA_CONFIG = {
  students: 15, // Total students to create
  mentors: 5, // Total mentors to create
  teams: 5, // Total teams to create
  projects: 8, // Total projects in project bank
  weeklyUpdates: 3, // Weekly updates per team
};

// Department and batch configurations
const DEPARTMENTS = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Information Technology",
];

const BATCHES = ["2024", "2023", "2022"];

const PROJECT_CATEGORIES = [
  "Web Development",
  "Mobile App Development",
  "Machine Learning",
  "IoT",
  "Blockchain",
  "Cybersecurity",
  "Data Science",
  "Game Development",
];

const PROJECT_TRACKS = [
  "R&D",
  "Consultancy",
  "Startup",
  "Project Pool",
  "Hardware",
];

// Generate sample data
function generateStudentData(index) {
  const dept = DEPARTMENTS[index % DEPARTMENTS.length];
  const batch = BATCHES[index % BATCHES.length];
  // Create 5-character department code by padding with the first letter if needed
  let deptCode = dept.replace(/\s+/g, "").toUpperCase();
  if (deptCode.length < 5) {
    deptCode = deptCode.padEnd(5, deptCode.charAt(0));
  } else if (deptCode.length > 5) {
    deptCode = deptCode.substring(0, 5);
  }

  return {
    name: `Student ${index + 1}`,
    username: `student${(index + 1).toString().padStart(3, "0")}`,
    email: `student${index + 1}@dept.edu`,
    password: `student${index + 1}123`,
    phone: `98${(10000000 + index).toString()}`.substring(0, 10), // Ensure exactly 10 digits
    role: "student",
    studentData: {
      rollNumber: `${batch.substr(2)}${deptCode}${(index + 1)
        .toString()
        .padStart(3, "0")}`, // Format: YY[5-char-dept]###
      batch: batch,
      department: dept,
      currentTeam: null, // Will be set when creating teams
    },
    firstLogin: index % 3 === 0, // Some students have already logged in
  };
}

function generateMentorData(index) {
  const dept = DEPARTMENTS[index % DEPARTMENTS.length];

  return {
    name: `Prof. ${
      ["Smith", "Johnson", "Williams", "Brown", "Davis"][index % 5]
    }`,
    username: `mentor${(index + 1).toString().padStart(2, "0")}`,
    email: `mentor${index + 1}@dept.edu`,
    password: `mentor${index + 1}123`,
    phone: `96${(10000000 + index).toString()}`.substring(0, 10), // Ensure exactly 10 digits and avoid conflict with students
    role: index === 0 ? "sub-admin" : "mentor", // First mentor is sub-admin
    mentorData: {
      empNo: `EMP${(2000 + index).toString()}`,
      department: dept,
      designation: index === 0 ? "Associate Professor" : "Assistant Professor",
      qualifications: "Ph.D. in " + dept,
      assignedTeams: [], // Will be populated when creating teams
      maxTeams: 3,
    },
    ...(index === 0 && {
      adminData: {
        empNo: `EMP${(2000 + index).toString()}`,
        department: dept,
        permissions: ["manage_students", "manage_teams", "approve_projects"],
        isSubAdmin: true,
      },
    }),
    firstLogin: false, // Mentors have all logged in
  };
}

function generateProjectData(index) {
  const category = PROJECT_CATEGORIES[index % PROJECT_CATEGORIES.length];
  const titles = [
    "AI-Powered Student Management System",
    "Smart Campus IoT Network",
    "Blockchain-based Certification Platform",
    "Real-time Traffic Monitoring App",
    "E-commerce Recommendation Engine",
    "Virtual Reality Learning Platform",
    "Automated Code Review Tool",
    "Sustainable Energy Monitoring System",
    "Social Media Analytics Dashboard",
    "Contactless Payment Gateway",
  ];

  return {
    title: titles[index % titles.length],
    description: `A comprehensive ${category.toLowerCase()} project that aims to solve real-world problems using cutting-edge technology. This project involves research, development, and implementation of innovative solutions.`,
    category: category,
    isApproved: index % 3 !== 2, // 2/3 projects are approved
    maxTeams: Math.floor(Math.random() * 2) + 1, // 1-2 teams max
    assignedTeams: [],
    feedback:
      index % 3 === 2
        ? [
            {
              message:
                "Needs more detailed technical specifications and feasibility analysis.",
              byUser: null, // Will be set to admin user
              at: new Date(
                Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
              ), // Random date within last 30 days
            },
          ]
        : [],
    rejectedAt:
      index % 3 === 2
        ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        : null,
  };
}

function generateTeamCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateWeeklyStatus(week, teamIndex) {
  const modules = [
    "Frontend Development",
    "Backend Development",
    "Database Design",
    "Testing",
    "Documentation",
  ];
  const achievements = [
    "Completed user interface design",
    "Implemented authentication system",
    "Set up database schema",
    "Created API endpoints",
    "Wrote unit tests",
    "Updated project documentation",
    "Fixed critical bugs",
    "Optimized performance",
  ];

  const challenges = [
    "Integration issues with third-party APIs",
    "Performance optimization challenges",
    "Database design complexity",
    "Time management difficulties",
    "Technical learning curve",
    "Resource constraints",
  ];

  return {
    week: week,
    dateRange: {
      from: new Date(Date.now() - (12 - week) * 7 * 24 * 60 * 60 * 1000),
      to: new Date(Date.now() - (11 - week) * 7 * 24 * 60 * 60 * 1000),
    },
    module: modules[week % modules.length],
    progress: `Week ${week} progress update with ${
      Math.floor(Math.random() * 40) + 60
    }% completion`,
    achievements: [
      achievements[Math.floor(Math.random() * achievements.length)],
      achievements[Math.floor(Math.random() * achievements.length)],
    ],
    challenges: [challenges[Math.floor(Math.random() * challenges.length)]],
    studentRemarks: `This week we focused on ${modules[
      week % modules.length
    ].toLowerCase()} and made significant progress.`,
    projectFile:
      week % 2 === 0
        ? {
            originalName: `week${week}_submission.pdf`,
            filename: `team_${teamIndex}_week${week}_${Date.now()}.pdf`,
            path: `/uploads/week${week}_submission.pdf`,
            size: Math.floor(Math.random() * 5000000) + 1000000, // 1-6MB
            uploadedAt: new Date(),
          }
        : null,
    mentorComments:
      week <= 3
        ? `Good progress on ${modules[
            week % modules.length
          ].toLowerCase()}. Keep up the excellent work!`
        : "",
    mentorScore: week <= 3 ? Math.floor(Math.random() * 3) + 7 : null, // 7-10 score for evaluated weeks
    mentorEvaluatedAt: week <= 3 ? new Date() : null,
    status: week <= 3 ? "mentor_approved" : week <= 5 ? "submitted" : "draft",
    submittedAt: new Date(
      Date.now() -
        (12 - week) * 7 * 24 * 60 * 60 * 1000 +
        Math.random() * 24 * 60 * 60 * 1000
    ),
  };
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

async function createUsers() {
  console.log("🔑 Creating users...");

  // Create default admin and dev users (same as fixedUsers middleware)
  const defaultUsers = [
    {
      username: process.env.ADMIN_USER || "admin",
      name: "Administrator",
      email: process.env.ADMIN_EMAIL || "admin@dept.edu",
      password: await hashPassword(process.env.ADMIN_PASS || "admin123"),
      role: "admin",
      phone: "9800000001", // Unique phone for admin
      adminData: {
        empNo: "ADMIN001",
        department: "Administration",
        permissions: ["all"],
        isSubAdmin: false,
      },
      firstLogin: false,
    },
    {
      username: process.env.DEV_USER || "dev",
      name: "Developer",
      email: process.env.DEV_EMAIL || "dev@dept.edu",
      password: await hashPassword(process.env.DEV_PASS || "dev123"),
      role: "dev",
      phone: "9800000002", // Unique phone for dev
      firstLogin: false,
    },
  ];

  // Create students
  const students = [];
  for (let i = 0; i < SAMPLE_DATA_CONFIG.students; i++) {
    const studentData = generateStudentData(i);
    studentData.password = await hashPassword(studentData.password);
    students.push(studentData);
  }

  // Create mentors
  const mentors = [];
  for (let i = 0; i < SAMPLE_DATA_CONFIG.mentors; i++) {
    const mentorData = generateMentorData(i);
    mentorData.password = await hashPassword(mentorData.password);
    mentors.push(mentorData);
  }

  // Insert all users
  const allUsers = [...defaultUsers, ...students, ...mentors];
  const createdUsers = await User.insertMany(allUsers);

  console.log(`✅ Created ${createdUsers.length} users:`);
  console.log(`   - 2 default users (admin, dev)`);
  console.log(`   - ${students.length} students`);
  console.log(`   - ${mentors.length} mentors (including 1 sub-admin)`);

  return {
    admin: createdUsers.find((u) => u.role === "admin"),
    dev: createdUsers.find((u) => u.role === "dev"),
    students: createdUsers.filter((u) => u.role === "student"),
    mentors: createdUsers.filter(
      (u) => u.role === "mentor" || u.role === "sub-admin"
    ),
  };
}

async function createProjects(adminUser) {
  console.log("🏗️ Creating projects...");

  const projects = [];
  for (let i = 0; i < SAMPLE_DATA_CONFIG.projects; i++) {
    const projectData = generateProjectData(i);
    if (projectData.feedback.length > 0) {
      projectData.feedback[0].byUser = adminUser._id;
    }
    if (adminUser && projectData.isApproved) {
      projectData.approvedBy = adminUser._id;
    }
    projects.push(projectData);
  }

  const createdProjects = await ProjectBank.insertMany(projects);
  console.log(`✅ Created ${createdProjects.length} projects in project bank`);

  return createdProjects;
}

async function createTeams(students, mentors, projects, adminUser) {
  console.log("👥 Creating teams...");

  const teams = [];
  const usedCodes = new Set();

  for (let i = 0; i < SAMPLE_DATA_CONFIG.teams; i++) {
    // Generate unique team code
    let teamCode;
    do {
      teamCode = generateTeamCode();
    } while (usedCodes.has(teamCode));
    usedCodes.add(teamCode);

    // Select team leader and members
    const teamSize = Math.floor(Math.random() * 3) + 2; // 2-4 members total
    const startIndex = i * 3; // Ensure no overlap between teams
    const availableStudents = students.slice(startIndex, startIndex + teamSize);

    if (availableStudents.length < 2) continue; // Skip if not enough students

    const leader = availableStudents[0];
    const members = availableStudents.slice(1).map((student) => ({
      student: student._id,
      joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    }));

    // Assign mentor
    const assignedMentor = mentors[i % mentors.length];

    // Select project choices (2-3 projects)
    const shuffledProjects = [...projects].sort(() => Math.random() - 0.5);
    const projectChoices = shuffledProjects.slice(
      0,
      Math.floor(Math.random() * 2) + 2
    );
    const finalProject = projectChoices[0];

    const team = {
      code: teamCode,
      leader: leader._id,
      members: members,
      batch: leader.studentData.batch,
      department: leader.studentData.department,
      projectChoices: projectChoices.map((p) => p._id),
      finalProject: finalProject._id,
      mentor: {
        assigned: assignedMentor._id,
        assignedAt: new Date(
          Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000
        ),
        preferences: [assignedMentor._id],
        currentPreference: 0,
      },
      status: i % 4 === 3 ? "pending" : "approved", // Most teams approved
      feedback: [],

      // Project Abstract
      projectAbstract: {
        projectTrack:
          PROJECT_TRACKS[Math.floor(Math.random() * PROJECT_TRACKS.length)],
        githubRepo: `https://github.com/team${teamCode.toLowerCase()}/${finalProject.title
          .toLowerCase()
          .replace(/\s+/g, "-")}`,
        tools: [
          {
            name: "React",
            version: "18.0.0",
            type: "Frontend Framework",
            purpose: "User interface development",
          },
          {
            name: "Node.js",
            version: "18.0.0",
            type: "Backend Runtime",
            purpose: "Server-side development",
          },
          {
            name: "MongoDB",
            version: "6.0",
            type: "Database",
            purpose: "Data storage",
          },
        ],
        modules: [
          {
            name: "User Management",
            functionality:
              "Handle user registration, authentication, and profile management",
          },
          {
            name: "Data Processing",
            functionality:
              "Process and analyze incoming data from various sources",
          },
          {
            name: "Reporting",
            functionality: "Generate reports and analytics dashboards",
          },
        ],
        submittedAt: new Date(
          Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000
        ),
        submittedBy: leader._id,
        status:
          i % 4 === 3
            ? "submitted"
            : i % 2 === 0
            ? "admin_approved"
            : "mentor_approved",
        mentorApproval: i % 4 !== 3,
        adminApproval: i % 2 === 0 && i % 4 !== 3,
      },

      // Role Specification
      roleSpecification: {
        assignments: availableStudents.map((student, idx) => ({
          member: student._id,
          modules: [`Module ${idx + 1}`, `Module ${idx + 2}`],
          activities: [
            {
              name: `Task ${idx + 1}.1`,
              softDeadline: new Date(
                Date.now() + (idx + 1) * 7 * 24 * 60 * 60 * 1000
              ),
              hardDeadline: new Date(
                Date.now() + (idx + 2) * 7 * 24 * 60 * 60 * 1000
              ),
              details: `Detailed implementation of task ${idx + 1}.1`,
            },
            {
              name: `Task ${idx + 1}.2`,
              softDeadline: new Date(
                Date.now() + (idx + 3) * 7 * 24 * 60 * 60 * 1000
              ),
              hardDeadline: new Date(
                Date.now() + (idx + 4) * 7 * 24 * 60 * 60 * 1000
              ),
              details: `Detailed implementation of task ${idx + 1}.2`,
            },
          ],
        })),
        submittedAt: new Date(
          Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000
        ),
        submittedBy: leader._id,
        status:
          i % 4 === 3
            ? "draft"
            : i % 2 === 0
            ? "admin_approved"
            : "mentor_approved",
        mentorApproval: i % 4 !== 3,
        adminApproval: i % 2 === 0 && i % 4 !== 3,
      },

      // Project Timeline
      projectTimeline:
        i % 4 !== 3
          ? {
              startDate: new Date(
                Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000
              ),
              endDate: new Date(
                Date.now() + (12 * 7 - Math.random() * 30) * 24 * 60 * 60 * 1000
              ),
              assignedAt: new Date(
                Date.now() - Math.random() * 50 * 24 * 60 * 60 * 1000
              ),
              assignedBy: adminUser._id,
              isAutoAssigned: Math.random() > 0.5,
              weekDuration: 12,
            }
          : {},

      // Weekly Status (only for approved teams with timeline)
      evaluation:
        i % 4 !== 3
          ? {
              weeklyStatus: Array.from(
                { length: SAMPLE_DATA_CONFIG.weeklyUpdates },
                (_, weekIndex) => generateWeeklyStatus(weekIndex + 1, i)
              ),
              summary: {
                totalWeeks: 12,
                moduleCompletion: {
                  total: 3,
                  completed: Math.floor(Math.random() * 2) + 1,
                  percentage: Math.floor(Math.random() * 50) + 25, // 25-75%
                },
                overallProgress: ["Poor", "Average", "Good", "Excellent"][
                  Math.floor(Math.random() * 4)
                ],
                estimatedCompletion: new Date(
                  Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000
                ),
                mentorRemarks:
                  "Team is progressing well with good communication and regular updates.",
              },
            }
          : {
              weeklyStatus: [],
              summary: {},
            },
    };

    teams.push(team);
  }

  const createdTeams = await Team.insertMany(teams);

  // Update student currentTeam references
  for (let i = 0; i < createdTeams.length; i++) {
    const team = createdTeams[i];
    const allTeamMembers = [team.leader, ...team.members.map((m) => m.student)];

    await User.updateMany(
      { _id: { $in: allTeamMembers } },
      { $set: { "studentData.currentTeam": team._id } }
    );
  }

  // Update mentor assignedTeams references
  for (const team of createdTeams) {
    if (team.mentor.assigned) {
      await User.updateOne(
        { _id: team.mentor.assigned },
        { $addToSet: { "mentorData.assignedTeams": team._id } }
      );
    }
  }

  // Update project assignedTeams references
  for (const team of createdTeams) {
    if (team.finalProject) {
      await ProjectBank.updateOne(
        { _id: team.finalProject },
        { $addToSet: { assignedTeams: team._id } }
      );
    }
  }

  console.log(
    `✅ Created ${createdTeams.length} teams with proper relationships`
  );

  return createdTeams;
}

async function createSystemSettings(adminUser) {
  console.log("⚙️ Creating system settings...");

  const systemSettings = new SystemSettings({
    projectTimeline: {
      globalStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      autoAssignEnabled: true,
      defaultProjectDuration: 12,
      enabledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      enabledBy: adminUser._id,
    },
    academicCalendar: {
      currentSemester: "Fall",
      currentYear: new Date().getFullYear(),
      semesterStartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      semesterEndDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
    },
    lastUpdatedBy: adminUser._id,
    version: "2.2.0",
  });

  await systemSettings.save();
  console.log("✅ Created system settings");

  return systemSettings;
}

async function generateDummyData() {
  try {
    // Connect to database
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.log("❌ MONGO_URI environment variable is not set");
      console.log("Please set MONGO_URI in your environment or .env file");
      return;
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // Clear existing data (except keep any existing data if you want to preserve it)
    console.log("🧹 Clearing existing test data...");

    // Only clear collections if they exist and you want fresh data
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const collectionNames = collections.map((c) => c.name);

    if (collectionNames.includes("users")) {
      await User.deleteMany({});
    }
    if (collectionNames.includes("teams")) {
      await Team.deleteMany({});
    }
    if (collectionNames.includes("projectbanks")) {
      await ProjectBank.deleteMany({});
    }
    if (collectionNames.includes("systemsettings")) {
      await SystemSettings.deleteMany({});
    }

    console.log("✅ Cleared existing data");

    // Generate all data
    console.log("\n🚀 Generating dummy data...\n");

    const users = await createUsers();
    const projects = await createProjects(users.admin);
    const teams = await createTeams(
      users.students,
      users.mentors,
      projects,
      users.admin
    );
    const systemSettings = await createSystemSettings(users.admin);

    // Print summary
    console.log("\n📊 Data Generation Summary:");
    console.log("=".repeat(50));
    console.log(`✅ Users: ${await User.countDocuments()}`);
    console.log(
      `   - Students: ${await User.countDocuments({ role: "student" })}`
    );
    console.log(
      `   - Mentors: ${await User.countDocuments({
        role: { $in: ["mentor", "sub-admin"] },
      })}`
    );
    console.log(
      `   - Admins: ${await User.countDocuments({
        role: { $in: ["admin", "dev"] },
      })}`
    );

    console.log(`✅ Teams: ${await Team.countDocuments()}`);
    console.log(
      `   - Approved: ${await Team.countDocuments({ status: "approved" })}`
    );
    console.log(
      `   - Pending: ${await Team.countDocuments({ status: "pending" })}`
    );

    console.log(`✅ Projects: ${await ProjectBank.countDocuments()}`);
    console.log(
      `   - Approved: ${await ProjectBank.countDocuments({ isApproved: true })}`
    );
    console.log(
      `   - Rejected: ${await ProjectBank.countDocuments({
        rejectedAt: { $ne: null },
      })}`
    );

    console.log(`✅ System Settings: ${await SystemSettings.countDocuments()}`);

    console.log("\n🎉 Dummy data generation completed successfully!");
    console.log("\n📝 Sample Login Credentials:");
    console.log("Admin:", users.admin.email, "/ admin123");
    console.log("Dev:", users.dev.email, "/ dev123");
    console.log("Student1:", users.students[0].email, "/ student1123");
    console.log("Mentor1:", users.mentors[0].email, "/ mentor1123");
  } catch (error) {
    console.error("❌ Error generating dummy data:", error);

    // Provide helpful error messages
    if (error.message.includes("ECONNREFUSED")) {
      console.log(
        "💡 Make sure MongoDB is running and the MONGO_URI is correct"
      );
    } else if (error.code === 11000) {
      console.log("💡 Duplicate key error - some data might already exist");
      console.log(
        "   Consider clearing the database before running this script"
      );
    } else {
      console.log("💡 Check the error details above and fix any issues");
    }
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run the script if called directly
if (require.main === module) {
  generateDummyData();
}

module.exports = {
  generateDummyData,
  SAMPLE_DATA_CONFIG,
  generateStudentData,
  generateMentorData,
  generateProjectData,
};
