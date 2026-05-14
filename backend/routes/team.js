const router = require("express").Router();
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Team = require("../models/Team");
const User = require("../models/User");
const SystemSettings = require("../models/SystemSettings");
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

// Helper functions for week calculations
const calculateCurrentWeek = (startDate) => {
  if (!startDate) return 0; // No week if no start date

  const now = new Date();
  const start = new Date(startDate);

  // Calculate difference in days
  const diffTime = Math.abs(now - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Calculate week number (1-indexed)
  const weekNumber = Math.ceil(diffDays / 7);

  return weekNumber > 0 ? weekNumber : 1;
};

const getWeekDateRange = (startDate, weekNumber) => {
  const start = new Date(startDate);
  const weekStart = new Date(
    start.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000
  );
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

  return {
    from: weekStart,
    to: weekEnd,
  };
};

const checkTeamTimelineAccess = (team) => {
  return Boolean(team.projectTimeline?.startDate);
};

// Configure multer for weekly status file uploads
const weeklyUploadsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "..", "uploads", "weekly-status");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Get user info for filename
    const userId = req.user._id;
    const originalName = file.originalname;
    const extension = path.extname(originalName);

    // We'll set the proper filename after getting team info
    cb(null, `temp_${userId}_${Date.now()}${extension}`);
  },
});

const weeklyUpload = multer({
  storage: weeklyUploadsStorage,
  fileFilter: function (req, file, cb) {
    // Only accept .zip files
    if (path.extname(file.originalname).toLowerCase() === ".zip") {
      cb(null, true);
    } else {
      cb(new Error("Only .zip files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

router.get(
  "/my-team",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const stu = await User.findById(req.user._id);
    if (!stu) {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    if (!stu.studentData?.currentTeam) {
      return res.status(404).json({ message: "No team found" });
    }

    const team = await Team.findById(stu.studentData.currentTeam)
      .populate({
        path: "leader",
        select:
          "name email username studentData.rollNumber studentData.batch studentData.department",
      })
      .populate({
        path: "members.student",
        select:
          "name email username studentData.rollNumber studentData.batch studentData.department",
      })
      .populate({
        path: "mentor.assigned",
        select:
          "name email username mentorData.department mentorData.designation mentorData.qualifications",
      })
      .populate({
        path: "mentor.preferences",
        select:
          "name email username mentorData.department mentorData.designation",
      })
      .populate({
        path: "projectChoices",
        select:
          "title description category difficulty techStack requiredSkills maxTeams",
      })
      .populate({
        path: "finalProject",
        select:
          "title description category difficulty techStack requiredSkills maxTeams",
      })
      .populate({
        path: "feedback.byUser",
        select: "name email role",
      })
      .populate({
        path: "projectAbstract.submittedBy",
        select: "name email",
      })
      .populate({
        path: "roleSpecification.submittedBy",
        select: "name email",
      })
      .populate({
        path: "roleSpecification.assignments.member",
        select: "name email username studentData.rollNumber",
      })
      .populate({
        path: "evaluation.weeklyStatus.submittedBy",
        select: "name email",
      });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    return res.status(200).json({ team });
  })
);

// Update Project Abstract
router.put(
  "/project-abstract",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const { projectTrack, githubRepo, tools, modules } = req.body;


    // Validate required fields
    if (!projectTrack || !githubRepo || !tools || !modules) {
      return res.status(400).json({
        message:
          "Project track, GitHub repository, tools, and modules are required",
      });
    }

    // Basic GitHub URL validation
    const githubUrlPattern =
      /^https?:\/\/(www\.)?github\.com\/[\w-.]+\/[\w-.]+\/?$/;
    if (!githubUrlPattern.test(githubRepo.trim())) {
      return res.status(400).json({
        message: "Please provide a valid GitHub repository URL",
      });
    }

    // Find the student's team
    const student = await User.findById(req.user._id);
    if (!student || !student.studentData?.currentTeam) {
      return res
        .status(404)
        .json({ message: "No team found for this student" });
    }

    const team = await Team.findById(student.studentData.currentTeam);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user is team leader or member
    const isLeader = team.leader.toString() === req.user._id.toString();
    const isMember = team.members.some(
      (member) => member.student.toString() === req.user._id.toString()
    );

    if (!isLeader && !isMember) {
      return res.status(403).json({
        message: "Only team members can update project abstract",
      });
    }

    // Update project abstract
    team.projectAbstract = {
      projectTrack,
      githubRepo: githubRepo.trim(),
      tools: tools.map((tool) => ({
        name: tool.name,
        version: tool.version || "",
        type: tool.type || "",
        purpose: tool.purpose || "",
      })),
      modules: modules.map((module) => ({
        name: module.name,
        functionality: module.functionality || "",
        description: module.description || "",
      })),
      submittedAt: new Date(),
      submittedBy: req.user._id,
      status: "submitted",
      mentorApproval: false,
      adminApproval: false,
    };

    await team.save();

    res.status(200).json({
      message: "Project abstract updated successfully",
      projectAbstract: team.projectAbstract,
    });
  })
);

// Update Role Specification
router.put(
  "/role-specification",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const { assignments } = req.body;

    // Validate required fields
    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({
        message: "Assignments array is required",
      });
    }

    // Find the student's team
    const student = await User.findById(req.user._id);
    if (!student || !student.studentData?.currentTeam) {
      return res
        .status(404)
        .json({ message: "No team found for this student" });
    }

    const team = await Team.findById(student.studentData.currentTeam);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user is team leader or member
    const isLeader = team.leader.toString() === req.user._id.toString();
    const isMember = team.members.some(
      (member) => member.student.toString() === req.user._id.toString()
    );

    if (!isLeader && !isMember) {
      return res.status(403).json({
        message: "Only team members can update role specification",
      });
    }

    // Validate assignments
    for (const assignment of assignments) {
      if (
        !assignment.member ||
        !assignment.modules ||
        !Array.isArray(assignment.modules)
      ) {
        return res.status(400).json({
          message: "Each assignment must have a member ID and modules array",
        });
      }
    }

    // Get all team members (leader + members)
    const allTeamMembers = [team.leader];
    team.members.forEach((member) => {
      allTeamMembers.push(member.student);
    });

    // Validate that all team members have exactly one assignment
    const assignedMembers = assignments.map((a) => a.member.toString());
    const missingMembers = allTeamMembers.filter(
      (memberId) => !assignedMembers.includes(memberId.toString())
    );
    const duplicateMembers = assignedMembers.filter(
      (member, index) => assignedMembers.indexOf(member) !== index
    );

    if (missingMembers.length > 0) {
      return res.status(400).json({
        message: "All team members must have an assignment",
        missingMembers,
      });
    }

    if (duplicateMembers.length > 0) {
      return res.status(400).json({
        message: "Each team member can only have one assignment",
        duplicateMembers,
      });
    }

    // Validate that each assignment has at least one module
    for (const assignment of assignments) {
      if (
        assignment.modules.length === 0 ||
        assignment.modules.every((m) => !m.trim())
      ) {
        return res.status(400).json({
          message: "Each assignment must have at least one module",
        });
      }
    }

    team.roleSpecification = {
      assignments: assignments.map((assignment) => ({
        member: assignment.member,
        modules: assignment.modules,
        activities: assignment.activities
          ? assignment.activities.map((activity) => ({
            name: activity.name,
            softDeadline: activity.softDeadline
              ? new Date(activity.softDeadline)
              : null,
            hardDeadline: activity.hardDeadline
              ? new Date(activity.hardDeadline)
              : null,
            details: activity.details || "",
          }))
          : [],
      })),
      submittedAt: new Date(),
      submittedBy: req.user._id,
      status: "submitted",
      mentorApproval: false,
      adminApproval: false,
    };

    await team.save();

    // Populate the assignments with member details for response
    await team.populate({
      path: "roleSpecification.assignments.member",
      select: "name email username studentData.rollNumber",
    });

    res.status(200).json({
      message: "Role specification updated successfully",
      roleSpecification: team.roleSpecification,
    });
  })
);

// Get Project Abstract Status
router.get(
  "/project-abstract/status",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const student = await User.findById(req.user._id);
    if (!student || !student.studentData?.currentTeam) {
      return res
        .status(404)
        .json({ message: "No team found for this student" });
    }

    const team = await Team.findById(student.studentData.currentTeam)
      .select("projectAbstract")
      .populate({
        path: "projectAbstract.submittedBy",
        select: "name email",
      });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.status(200).json({
      projectAbstract: team.projectAbstract || null,
    });
  })
);

// Get Role Specification Status
router.get(
  "/role-specification/status",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const student = await User.findById(req.user._id);
    if (!student || !student.studentData?.currentTeam) {
      return res
        .status(404)
        .json({ message: "No team found for this student" });
    }

    const team = await Team.findById(student.studentData.currentTeam)
      .select("roleSpecification")
      .populate({
        path: "roleSpecification.submittedBy",
        select: "name email",
      })
      .populate({
        path: "roleSpecification.assignments.member",
        select: "name email username studentData.rollNumber",
      });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.status(200).json({
      roleSpecification: team.roleSpecification || null,
    });
  })
);

// Get current week information for team
router.get(
  "/current-week",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const student = await User.findById(req.user._id);
    if (!student || !student.studentData?.currentTeam) {
      return res
        .status(404)
        .json({ message: "No team found for this student" });
    }

    const team = await Team.findById(student.studentData.currentTeam);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if team has project timeline assigned
    if (!checkTeamTimelineAccess(team)) {
      return res.status(403).json({
        message:
          "Project timeline not assigned yet. Please wait for admin to set the project start date.",
        hasTimeline: false,
        teamStatus: team.status,
        hasMentor: Boolean(team.mentor?.assigned),
      });
    }

    const projectStart = team.projectTimeline.startDate;
    const currentWeek = calculateCurrentWeek(projectStart);
    const weekDateRange = getWeekDateRange(projectStart, currentWeek);

    // Check if current week already has submission
    const hasSubmission = team.evaluation?.weeklyStatus?.some(
      (status) => status.week === currentWeek
    );

    // Get max allowable week (current week)
    const maxWeek = currentWeek;

    res.status(200).json({
      hasTimeline: true,
      currentWeek,
      maxWeek,
      dateRange: weekDateRange,
      hasSubmission,
      projectStartDate: projectStart,
      projectEndDate: team.projectTimeline.endDate,
      projectDuration: team.projectTimeline.weekDuration,
      timelineProgress: team.timelineProgressPercentage,
      availableWeeks: Array.from({ length: currentWeek }, (_, i) => i + 1),
      isAutoAssigned: team.projectTimeline.isAutoAssigned,
    });
  })
);

// Weekly Status Routes
router.get(
  "/weekly-status",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Find user to get team
    const user = await User.findById(userId).select("studentData.currentTeam");
    if (!user?.studentData?.currentTeam) {
      return res.status(404).json({ message: "No team found" });
    }

    // Get team with weekly status data
    const team = await Team.findById(user.studentData.currentTeam)
      .select("evaluation.weeklyStatus projectTimeline")
      .populate({
        path: "evaluation.weeklyStatus.submittedBy",
        select: "name email",
      });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check timeline access
    if (!checkTeamTimelineAccess(team)) {
      return res.status(403).json({
        message:
          "Weekly status access denied. Project timeline not assigned yet.",
        hasTimeline: false,
      });
    }

    // Format weekly status for student view (exclude file paths for security)
    const formattedWeeklyStatus =
      team.evaluation?.weeklyStatus?.map((submission) => ({
        _id: submission._id,
        week: submission.week,
        dateRange: submission.dateRange,
        module: submission.module,
        progress: submission.progress,
        achievements: submission.achievements,
        challenges: submission.challenges,
        studentRemarks: submission.studentRemarks,
        projectFile: submission.projectFile
          ? {
            originalName: submission.projectFile.originalName,
            filename: submission.projectFile.filename,
            size: submission.projectFile.size,
            uploadedAt: submission.projectFile.uploadedAt,
          }
          : null,
        status: submission.status || "submitted",
        mentorScore: submission.mentorScore || null,
        mentorComments: submission.mentorComments || "",
        submittedAt: submission.submittedAt,
        submittedBy: submission.submittedBy,
        scoredAt: submission.scoredAt || null,
      })) || [];

    res.status(200).json({
      weeklyStatus: formattedWeeklyStatus,
      hasTimeline: true,
      projectTimeline: team.projectTimeline,
    });
  })
);

router.post(
  "/weekly-status",
  authenticate,
  authorizeRoles("student"),
  weeklyUpload.single("projectFile"),
  asyncHandler(async (req, res) => {
    let {
      week,
      dateRange,
      module,
      progress,
      achievements,
      challenges,
      studentRemarks,
    } = req.body;

    // Parse JSON strings from FormData
    try {
      if (typeof dateRange === "string") {
        dateRange = JSON.parse(dateRange);
      }
      if (typeof achievements === "string") {
        achievements = JSON.parse(achievements);
      }
      if (typeof challenges === "string") {
        challenges = JSON.parse(challenges);
      }
    } catch (error) {
      // Clean up uploaded file if parsing fails
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(400).json({
        message: "Invalid JSON format in request data",
      });
    }

    // Validate required fields
    if (
      !week ||
      !dateRange ||
      !module ||
      !progress ||
      !achievements ||
      !challenges
    ) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(400).json({
        message: "All required fields must be provided",
        required: [
          "week",
          "dateRange",
          "module",
          "progress",
          "achievements",
          "challenges",
        ],
      });
    }

    // File upload is now optional - no validation required
    // If file is uploaded, it will be processed below

    // Find the student's team
    const student = await User.findById(req.user._id);
    if (!student || !student.studentData?.currentTeam) {
      // Clean up uploaded file if present
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res
        .status(404)
        .json({ message: "No team found for this student" });
    }

    const team = await Team.findById(student.studentData.currentTeam)
      .populate("leader", "studentData.rollNumber")
      .populate("members.student", "studentData.rollNumber");

    if (!team) {
      // Clean up uploaded file if present
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user is team leader or member
    const isLeader = team.leader._id.toString() === req.user._id.toString();
    const isMember = team.members.some(
      (member) => member.student._id.toString() === req.user._id.toString()
    );

    if (!isLeader && !isMember) {
      // Clean up uploaded file if present
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(403).json({
        message: "Only team leader or team members can submit weekly status",
      });
    }

    // Check timeline access
    if (!checkTeamTimelineAccess(team)) {
      // Clean up uploaded file if present
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(403).json({
        message:
          "Weekly status access denied. Project timeline not assigned yet.",
        hasTimeline: false,
      });
    }

    // Parse and validate week number first
    const weekNumber = parseInt(week);
    if (isNaN(weekNumber)) {
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(400).json({
        message: "Invalid week number format",
      });
    }

    // Validate week number against current week
    const currentWeek = calculateCurrentWeek(team.projectTimeline.startDate);
    if (weekNumber > currentWeek) {
      // Clean up uploaded file if present
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(400).json({
        message: `Cannot submit for future weeks. Current week is ${currentWeek}`,
        currentWeek,
        maxWeek: currentWeek,
      });
    }

    if (weekNumber < 1 || weekNumber > team.projectTimeline.weekDuration) {
      // Clean up uploaded file if present
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(400).json({
        message: `Invalid week number. Must be between 1 and ${Math.min(
          currentWeek,
          team.projectTimeline.weekDuration
        )}`,
        currentWeek,
        maxWeek: Math.min(currentWeek, team.projectTimeline.weekDuration),
      });
    }

    // Check if this week already has a submission for the same module
    if (!team.evaluation) {
      team.evaluation = { weeklyStatus: [] };
    }

    // Find any existing submission for the same week+module by THIS user
    const existingSubmission = team.evaluation.weeklyStatus.find((status) => {
      try {
        return (
          parseInt(status.week) === weekNumber &&
          status.module === module.trim() &&
          String(status.submittedBy) === String(req.user._id)
        );
      } catch (e) {
        return false;
      }
    });

    if (existingSubmission) {
      // If the existing submission (by this user) was rejected, allow resubmission
      // by updating the same entry instead of creating a new one. This prevents
      // duplicate blocks for the same week+module for the same student.
      if (existingSubmission.status === "rejected") {
        // Prepare updated fields
        existingSubmission.dateRange = {
          from: new Date(dateRange.from),
          to: new Date(dateRange.to),
        };
        existingSubmission.progress = progress.trim();
        existingSubmission.achievements = achievements
          .filter((a) => a && a.trim())
          .map((a) => a.trim());
        existingSubmission.challenges = challenges
          .filter((c) => c && c.trim())
          .map((c) => c.trim());
        existingSubmission.studentRemarks = studentRemarks ? studentRemarks.trim() : "";
        existingSubmission.submittedAt = new Date();
        existingSubmission.submittedBy = req.user._id;
        // Reset mentor evaluation fields so mentor can review again
        existingSubmission.mentorComments = "";
        existingSubmission.mentorScore = null;
        existingSubmission.mentorEvaluatedAt = null;
        existingSubmission.mentorEvaluatedBy = null;
        // Set status back to submitted
        existingSubmission.status = "submitted";

        // If a file is uploaded with resubmission, replace previous file
        if (req.file) {
          const fs = require("fs");
          const userRollNumber = (
            (await User.findById(req.user._id))?.studentData?.rollNumber || "unknown"
          );
          const properFilename = `${userRollNumber}_${team.code}_week${week}.zip`;
          const newFilePath = path.join(path.dirname(req.file.path), properFilename);
          try {
            fs.renameSync(req.file.path, newFilePath);

            // remove old file if exists
            const oldFile = existingSubmission.projectFile?.path;
            if (oldFile && fs.existsSync(oldFile)) {
              try {
                fs.unlinkSync(oldFile);
              } catch (e) {
                // ignore errors
              }
            }

            existingSubmission.projectFile = {
              originalName: req.file.originalname,
              filename: properFilename,
              path: newFilePath,
              size: req.file.size,
              uploadedAt: new Date(),
            };
          } catch (error) {
            if (req.file) {
              fs.unlink(req.file.path, () => { });
            }
            return res.status(500).json({ message: "Error processing uploaded file" });
          }
        }

        await team.save();

        return res.status(200).json({
          message: `Week ${weekNumber} status for module "${module}" resubmitted (previous rejected entry updated).`,
          weeklyStatus: existingSubmission,
        });
      }

      // Clean up uploaded file if present
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(400).json({
        message: `You have already submitted Week ${weekNumber} status for module "${module}". If you need to update it, please edit your existing submission or resubmit after rejection.`,
      });
    }

    // Validate that module exists in role specification
    const availableModules = [];
    if (team.roleSpecification?.assignments) {
      team.roleSpecification.assignments.forEach((assignment) => {
        if (assignment.modules) {
          availableModules.push(...assignment.modules);
        }
      });
    }

    if (!availableModules.includes(module)) {
      // Clean up uploaded file if present
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(400).json({
        message: "Selected module is not available in your role specification",
      });
    }

    // Prepare file information object (if file was uploaded)
    let projectFileData = null;
    if (req.file) {
      // Get user's roll number for filename
      const userRollNumber = student.studentData?.rollNumber;
      if (!userRollNumber) {
        // Clean up uploaded file
        fs.unlink(req.file.path, () => { });
        return res.status(400).json({
          message: "Student roll number not found",
        });
      }

      // Create proper filename: rollno_teamcode_weekX.zip
      const properFilename = `${userRollNumber}_${team.code}_week${week}.zip`;
      const newFilePath = path.join(
        path.dirname(req.file.path),
        properFilename
      );

      try {
        // Rename file to proper format
        fs.renameSync(req.file.path, newFilePath);

        // Set file data for saving
        projectFileData = {
          originalName: req.file.originalname,
          filename: properFilename,
          path: newFilePath,
          size: req.file.size,
        };
      } catch (error) {
        // Clean up uploaded file
        fs.unlink(req.file.path, () => { });
        return res.status(500).json({
          message: "Error processing uploaded file",
        });
      }
    }

    // Create new weekly status entry
    const newWeeklyStatus = {
      week: weekNumber,
      dateRange: {
        from: new Date(dateRange.from),
        to: new Date(dateRange.to),
      },
      module: module.trim(),
      progress: progress.trim(),
      achievements: achievements
        .filter((a) => a && a.trim())
        .map((a) => a.trim()),
      challenges: challenges.filter((c) => c && c.trim()).map((c) => c.trim()),
      studentRemarks: studentRemarks ? studentRemarks.trim() : "",

      // File information (only if file was uploaded)
      ...(projectFileData && { projectFile: projectFileData }),

      // Initial status
      status: "submitted",
      submittedAt: new Date(),
      submittedBy: req.user._id,
    };

    // Add to team's weekly status
    team.evaluation.weeklyStatus.push(newWeeklyStatus);

    // Sort by week number
    team.evaluation.weeklyStatus.sort((a, b) => a.week - b.week);

    await team.save();

    res.status(201).json({
      message: `Week ${weekNumber} status submitted successfully`,
      weeklyStatus: newWeeklyStatus,
    });
  })
);

// Download weekly status file
router.get(
  "/:teamId/weekly-status/:week/download",
  authenticate,
  authorizeRoles("student", "mentor", "admin", "sub-admin"),
  asyncHandler(async (req, res) => {
    const { teamId, week } = req.params;
    const weekNumber = parseInt(week);

    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check authorization
    const isMentor =
      req.user.role === "mentor" &&
      team.mentor?.assigned?.toString() === req.user._id.toString();
    const isAdmin = ["admin", "sub-admin"].includes(req.user.role);
    const isTeamMember =
      team.leader.toString() === req.user._id.toString() ||
      team.members.some(
        (m) => m.student.toString() === req.user._id.toString()
      );

    if (!isMentor && !isAdmin && !isTeamMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find the weekly status submission
    const weeklySubmission = team.evaluation?.weeklyStatus?.find(
      (w) => w.week === weekNumber
    );

    if (!weeklySubmission) {
      return res
        .status(404)
        .json({ message: "Weekly status not found for this week" });
    }

    if (!weeklySubmission.projectFile || !weeklySubmission.projectFile.path) {
      return res
        .status(404)
        .json({ message: "No file attached to this weekly status" });
    }

    // Check if file exists
    if (!fs.existsSync(weeklySubmission.projectFile.path)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    // Send file
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${weeklySubmission.projectFile.filename}"`
    );
    res.sendFile(path.resolve(weeklySubmission.projectFile.path));
  })
);

router.put(
  "/weekly-status/:week",
  authenticate,
  authorizeRoles("student"),
  weeklyUpload.single("projectFile"),
  asyncHandler(async (req, res) => {
    const { week } = req.params;
    let {
      dateRange,
      module,
      progress,
      achievements,
      challenges,
      studentRemarks,
    } = req.body;

    // If the request was sent as multipart/form-data (with file), some fields
    // may be JSON strings — try to parse them.
    try {
      if (typeof dateRange === "string") dateRange = JSON.parse(dateRange);
      if (typeof achievements === "string") achievements = JSON.parse(achievements);
      if (typeof challenges === "string") challenges = JSON.parse(challenges);
    } catch (err) {
      // Clean up uploaded file if parsing fails
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(400).json({ message: "Invalid JSON format in request data" });
    }

    // Find the student's team
    const student = await User.findById(req.user._id);
    if (!student || !student.studentData?.currentTeam) {
      return res
        .status(404)
        .json({ message: "No team found for this student" });
    }

    const team = await Team.findById(student.studentData.currentTeam);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user is team leader or member
    const isLeader = team.leader.toString() === req.user._id.toString();
    const isMember = team.members.some(
      (member) => member.student.toString() === req.user._id.toString()
    );

    if (!isLeader && !isMember) {
      return res.status(403).json({
        message: "Only team members can update weekly status",
      });
    }

    // Find the weekly status to update. Prefer matching both week and module
    // when module is provided to avoid ambiguities when multiple modules are
    // submitted in the same week.
    // Prefer matching this student's own submission for the given week/module
    const weeklyStatusIndex = team.evaluation?.weeklyStatus?.findIndex(
      (status) =>
        status.week === parseInt(week) &&
        (!module || !String(module).trim() || status.module === String(module).trim()) &&
        String(status.submittedBy) === String(req.user._id)
    );

    if (weeklyStatusIndex === -1) {
      return res.status(404).json({
        message: `Week ${week} status not found`,
      });
    }

    // Update the weekly status
    const updatedStatus = {
      ...team.evaluation.weeklyStatus[weeklyStatusIndex],
      dateRange: dateRange
        ? {
          from: new Date(dateRange.from),
          to: new Date(dateRange.to),
        }
        : team.evaluation.weeklyStatus[weeklyStatusIndex].dateRange,
      module: module
        ? module.trim()
        : team.evaluation.weeklyStatus[weeklyStatusIndex].module,
      progress: progress
        ? progress.trim()
        : team.evaluation.weeklyStatus[weeklyStatusIndex].progress,
      achievements: achievements
        ? achievements.filter((a) => a && a.trim()).map((a) => a.trim())
        : team.evaluation.weeklyStatus[weeklyStatusIndex].achievements,
      challenges: challenges
        ? challenges.filter((c) => c && c.trim()).map((c) => c.trim())
        : team.evaluation.weeklyStatus[weeklyStatusIndex].challenges,
      studentRemarks:
        studentRemarks !== undefined
          ? studentRemarks.trim()
          : team.evaluation.weeklyStatus[weeklyStatusIndex].studentRemarks,
      submittedAt: new Date(),
      submittedBy: req.user._id,
    };

    // Handle new uploaded file (optional). If a new file is uploaded, rename it and
    // replace the previous projectFile entry. If there was an old file, remove it.
    if (req.file) {
      const fs = require("fs");
      const student = await User.findById(req.user._id);
      const userRollNumber = student.studentData?.rollNumber;
      const properFilename = `${userRollNumber}_${team.code}_week${week}.zip`;
      const newFilePath = path.join(path.dirname(req.file.path), properFilename);

      try {
        fs.renameSync(req.file.path, newFilePath);

        // Remove old file if exists
        const oldFile = team.evaluation.weeklyStatus[weeklyStatusIndex].projectFile?.path;
        if (oldFile && fs.existsSync(oldFile)) {
          try {
            fs.unlinkSync(oldFile);
          } catch (e) {
            // ignore unlink errors
          }
        }

        updatedStatus.projectFile = {
          originalName: req.file.originalname,
          filename: properFilename,
          path: newFilePath,
          size: req.file.size,
          uploadedAt: new Date(),
        };
      } catch (error) {
        if (req.file) {
          fs.unlink(req.file.path, () => { });
        }
        return res.status(500).json({ message: "Error processing uploaded file" });
      }
    }
    team.evaluation.weeklyStatus[weeklyStatusIndex] = updatedStatus;

    await team.save();

    res.status(200).json({
      message: `Week ${week} status updated successfully`,
      weeklyStatus: team.evaluation.weeklyStatus,
    });
  })
);

// Approve weekly status (Mentor only)
router.put(
  "/:teamId/weekly-status/:submissionId/approve",
  authenticate,
  authorizeRoles("mentor"),
  asyncHandler(async (req, res) => {
    const { teamId, submissionId } = req.params;

    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if mentor is assigned to this team
    if (
      !team.mentor?.assigned ||
      team.mentor.assigned.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this team" });
    }

    // Find the weekly status submission by _id
    const weeklyStatus = team.evaluation?.weeklyStatus?.find(
      (w) => w._id.toString() === submissionId
    );

    if (!weeklyStatus) {
      return res
        .status(404)
        .json({ message: "Weekly status submission not found" });
    }

    if (weeklyStatus.status === "mentor_approved") {
      return res
        .status(400)
        .json({ message: "This weekly status is already approved" });
    }

    // Accept mentor score from request body. Require a valid score before approving.
    const { score, mentorComments } = req.body;

    // If there is no existing mentorScore and no score provided in request, reject
    const hasExistingScore = weeklyStatus.mentorScore !== undefined && weeklyStatus.mentorScore !== null;
    const providedScore = score !== undefined && score !== null && score !== "";

    if (!hasExistingScore && !providedScore) {
      return res.status(400).json({ message: "Mentor score is required before approving. Provide a score between 0 and 10." });
    }

    // If provided, validate and set the score
    if (providedScore) {
      const numericScore = Number(score);
      if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
        return res.status(400).json({ message: "Score must be a number between 0 and 10." });
      }
      weeklyStatus.mentorScore = numericScore;
    }

    // Optionally update mentor comments
    if (mentorComments !== undefined) {
      weeklyStatus.mentorComments = String(mentorComments).trim();
    }

    // Update status to approved and record review metadata
    weeklyStatus.status = "mentor_approved";
    weeklyStatus.scoredAt = new Date();
    weeklyStatus.mentorEvaluatedAt = new Date();
    weeklyStatus.mentorEvaluatedBy = req.user._id;

    await team.save();

    res.status(200).json({
      message: `Week ${weeklyStatus.week} status for module "${weeklyStatus.module}" approved successfully`,
      weeklyStatus,
    });
  })
);

// Reject weekly status (Mentor only)
router.put(
  "/:teamId/weekly-status/:submissionId/reject",
  authenticate,
  authorizeRoles("mentor"),
  asyncHandler(async (req, res) => {
    const { teamId, submissionId } = req.params;
    const { reason } = req.body;

    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if mentor is assigned to this team
    if (
      !team.mentor?.assigned ||
      team.mentor.assigned.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this team" });
    }

    // Find the weekly status submission by _id
    const weeklyStatusIndex = team.evaluation?.weeklyStatus?.findIndex(
      (w) => w._id.toString() === submissionId
    );

    if (weeklyStatusIndex === -1) {
      return res
        .status(404)
        .json({ message: "Weekly status submission not found" });
    }

    const weeklyStatus = team.evaluation.weeklyStatus[weeklyStatusIndex];

    // Store week and module info for response message
    const weekNumber = weeklyStatus.week;
    const moduleName = weeklyStatus.module;

    // Mark the submission as rejected and preserve it so students can view feedback
    weeklyStatus.status = "rejected";
    // store mentor's reason/comment if provided
    weeklyStatus.mentorComments = reason !== undefined && reason !== null ? String(reason).trim() : weeklyStatus.mentorComments;
    // record when mentor reviewed/rejected it (frontend shows scoredAt as review timestamp)
    weeklyStatus.scoredAt = new Date();
    // keep mentor evaluator metadata where applicable
    weeklyStatus.mentorEvaluatedAt = new Date();
    weeklyStatus.mentorEvaluatedBy = req.user._id;

    await team.save();

    // TODO: Optionally send notification to student about rejection

    res.status(200).json({
      message: `Week ${weekNumber} status for module "${moduleName}" rejected.`,
      weeklyStatus,
    });
  })
);

// Admin routes for project timeline management
router.get(
  "/admin/timeline-settings",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getSettings();

    res.status(200).json({
      globalSettings: settings.projectTimeline,
      academicCalendar: settings.academicCalendar,
    });
  })
);

router.put(
  "/admin/timeline-settings",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const { globalStartDate, autoAssignEnabled, defaultProjectDuration } =
      req.body;

    if (!globalStartDate) {
      return res.status(400).json({
        message: "Global start date is required",
      });
    }

    const settings = await SystemSettings.getSettings();
    await settings.updateProjectTimeline(
      {
        globalStartDate,
        autoAssignEnabled: Boolean(autoAssignEnabled),
        defaultProjectDuration: defaultProjectDuration || 12,
      },
      req.user._id
    );

    // If auto-assign is enabled, assign timeline to eligible teams
    let autoAssignResults = [];
    if (autoAssignEnabled) {
      autoAssignResults = await Team.autoAssignTimeline(
        globalStartDate,
        defaultProjectDuration || 12,
        req.user._id
      );
    }

    res.status(200).json({
      message: "Timeline settings updated successfully",
      settings: settings.projectTimeline,
      autoAssignResults,
    });
  })
);

router.get(
  "/admin/eligible-teams",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const eligibleTeams = await Team.findEligibleForAutoAssignment()
      .populate("leader", "name email studentData.rollNumber")
      .populate("members.student", "name email studentData.rollNumber")
      .populate("mentor.assigned", "name email mentorData.department");

    res.status(200).json({
      eligibleTeams,
      count: eligibleTeams.length,
    });
  })
);

router.post(
  "/admin/assign-timeline/:teamId",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { startDate, duration = 12 } = req.body;

    if (!startDate) {
      return res.status(400).json({
        message: "Start date is required",
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.projectTimeline?.startDate) {
      return res.status(400).json({
        message: "Team already has a project timeline assigned",
      });
    }

    await team.assignProjectTimeline(startDate, duration, req.user._id, false);

    res.status(200).json({
      message: "Project timeline assigned successfully",
      team: {
        id: team._id,
        code: team.code,
        projectTimeline: team.projectTimeline,
      },
    });
  })
);

router.delete(
  "/admin/remove-timeline/:teamId",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const { teamId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Remove project timeline
    team.projectTimeline = undefined;
    await team.save();

    res.status(200).json({
      message: "Project timeline removed successfully",
    });
  })
);

// Routes for Form Approval

// Get teams with forms pending approval (Admin)
router.get(
  "/admin/forms-for-approval",
  authenticate,
  authorizeRoles("admin", "sub-admin"),
  asyncHandler(async (req, res) => {
    try {
      // Admin only sees forms that have been approved by mentor but not yet by admin
      const teams = await Team.find({
        $or: [
          { "projectAbstract.status": "mentor_approved" },
          { "roleSpecification.status": "mentor_approved" },
        ],
      })
        .populate("leader", "name email studentData.rollNumber")
        .populate("members.student", "name email studentData.rollNumber")
        .populate("finalProject", "title description category")
        .populate("projectChoices", "title description category")
        .populate(
          "roleSpecification.assignments.member",
          "name email studentData.rollNumber"
        )
        .lean();

      // Add pending forms count for each team
      const teamsWithCounts = teams.map((team) => {
        let pendingFormsCount = 0;

        if (team.projectAbstract?.status === "mentor_approved") {
          pendingFormsCount++;
        }
        if (team.roleSpecification?.status === "mentor_approved") {
          pendingFormsCount++;
        }

        return {
          ...team,
          pendingFormsCount,
        };
      });

      res.status(200).json({
        teams: teamsWithCounts,
        totalPendingForms: teamsWithCounts.reduce(
          (sum, team) => sum + team.pendingFormsCount,
          0
        ),
      });
    } catch (error) {
      console.error("Error fetching teams for approval:", error);
      res.status(500).json({ message: "Failed to fetch teams for approval" });
    }
  })
);

// Get teams with forms pending approval (Mentor)
router.get(
  "/mentor/forms-for-approval",
  authenticate,
  authorizeRoles("mentor", "sub-admin"),
  asyncHandler(async (req, res) => {
    try {
      const mentorId = req.user._id;

      const teams = await Team.find({
        "mentor.assigned": mentorId,
        $or: [
          { "projectAbstract.status": "submitted" },
          { "roleSpecification.status": "submitted" },
        ],
      })
        .populate("leader", "name email studentData.rollNumber")
        .populate("members.student", "name email studentData.rollNumber")
        .populate("finalProject", "title description category")
        .populate("projectChoices", "title description category")
        .populate(
          "roleSpecification.assignments.member",
          "name email studentData.rollNumber"
        )
        .lean();

      // Add pending forms count for each team
      const teamsWithCounts = teams.map((team) => {
        let pendingFormsCount = 0;

        if (team.projectAbstract?.status === "submitted") {
          pendingFormsCount++;
        }
        if (team.roleSpecification?.status === "submitted") {
          pendingFormsCount++;
        }

        return {
          ...team,
          pendingFormsCount,
        };
      });

      res.status(200).json({
        teams: teamsWithCounts,
        totalPendingForms: teamsWithCounts.reduce(
          (sum, team) => sum + team.pendingFormsCount,
          0
        ),
      });
    } catch (error) {
      console.error("Error fetching teams for approval:", error);
      res.status(500).json({ message: "Failed to fetch teams for approval" });
    }
  })
);

// Approve/Reject form (Admin)
router.post(
  "/admin/approve-form",
  authenticate,
  authorizeRoles("admin", "sub-admin"),
  asyncHandler(async (req, res) => {
    try {
      const { teamId, formType, action, customMessage } = req.body;

      if (!teamId || !formType || !action) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }

      if (!["projectAbstract", "roleSpecification"].includes(formType)) {
        return res.status(400).json({ message: "Invalid form type" });
      }

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      const form = team[formType];
      if (!form || form.status !== "mentor_approved") {
        return res
          .status(400)
          .json({ message: "Form not found or not mentor approved yet" });
      }

      // Generate default message based on action and role
      const defaultMessage =
        action === "approve"
          ? `${formType === "projectAbstract"
            ? "Project Abstract (Form 1)"
            : "Role Specification (Form 2)"
          } has been approved by Admin.`
          : `${formType === "projectAbstract"
            ? "Project Abstract (Form 1)"
            : "Role Specification (Form 2)"
          } has been rejected by Admin. Please review and resubmit.`;

      // Combine default message with custom message if provided
      const finalMessage = customMessage
        ? `${defaultMessage} Additional note: ${customMessage}`
        : defaultMessage;

      // Update form status
      if (action === "approve") {
        form.status = "admin_approved";
        form.adminApproval = true;
      } else {
        form.status = "rejected";
        form.adminApproval = false;
      }

      // Add feedback to team
      team.feedback.push({
        message: finalMessage,
        byUser: req.user._id,
        at: new Date(),
      });

      await team.save();

      res.status(200).json({
        message: `Form ${action}ed successfully`,
        updatedStatus: form.status,
      });
    } catch (error) {
      console.error("Error approving/rejecting form:", error);
      res.status(500).json({ message: "Failed to process form action" });
    }
  })
);

// Approve/Reject form (Mentor)
router.post(
  "/mentor/approve-form",
  authenticate,
  authorizeRoles("mentor", "sub-admin"),
  asyncHandler(async (req, res) => {
    try {
      const { teamId, formType, action, customMessage } = req.body;
      const mentorId = req.user._id;

      if (!teamId || !formType || !action) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }

      if (!["projectAbstract", "roleSpecification"].includes(formType)) {
        return res.status(400).json({ message: "Invalid form type" });
      }

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Check if mentor is assigned to this team
      if (
        !team.mentor.assigned ||
        team.mentor.assigned.toString() !== mentorId.toString()
      ) {
        return res
          .status(403)
          .json({ message: "You are not assigned to this team" });
      }

      const form = team[formType];
      if (!form || form.status !== "submitted") {
        return res
          .status(400)
          .json({ message: "Form not found or not submitted" });
      }

      // Generate default message based on action and role
      const defaultMessage =
        action === "approve"
          ? `${formType === "projectAbstract"
            ? "Project Abstract (Form 1)"
            : "Role Specification (Form 2)"
          } has been approved by Mentor.`
          : `${formType === "projectAbstract"
            ? "Project Abstract (Form 1)"
            : "Role Specification (Form 2)"
          } has been rejected by Mentor. Please review and resubmit.`;

      // Combine default message with custom message if provided
      const finalMessage = customMessage
        ? `${defaultMessage} Additional note: ${customMessage}`
        : defaultMessage;

      // Update form status
      if (action === "approve") {
        form.status = "mentor_approved";
        form.mentorApproval = true;
      } else {
        form.status = "rejected";
        form.mentorApproval = false;
      }

      // Add feedback to team
      team.feedback.push({
        message: finalMessage,
        byUser: req.user._id,
        at: new Date(),
      });

      await team.save();

      res.status(200).json({
        message: `Form ${action}ed successfully`,
        updatedStatus: form.status,
      });
    } catch (error) {
      console.error("Error approving/rejecting form:", error);
      res.status(500).json({ message: "Failed to process form action" });
    }
  })
);

// ============================================
// PDF DOCUMENT UPLOAD ROUTES (Student/Team Leader)
// ============================================

// Configure multer for PDF document uploads
const pdfUploadsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "..", "uploads", "team-documents");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    // Use teamCode_documentType format if available, otherwise fallback to timestamp
    const teamCode = req.teamCode || "team";
    const docType = req.params.documentType || "document";
    cb(null, `${teamCode}_${docType}${extension}`);
  },
});

const pdfUpload = multer({
  storage: pdfUploadsStorage,
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    // Allow only PDF uploads at the middleware level; specific document validation
    if (ext === ".pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Get team's document upload status (all members can view)
router.get(
  "/my-team/documents",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    try {
      const { DocumentTypesConfig } = require("../config/documentTypes");

      // Find student's team
      const student = await User.findById(req.user._id);
      if (!student?.studentData?.currentTeam) {
        return res
          .status(404)
          .json({ message: "You are not part of any team" });
      }

      const team = await Team.findById(student.studentData.currentTeam)
        .populate("leader", "name email")
        .populate("members.student", "name email")
        .lean();

      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Check if current user is the team leader
      const isLeader = team.leader._id.toString() === req.user._id.toString();

      // Get PDF document types
      const pdfDocTypes = DocumentTypesConfig.getEnabled().filter(
        (doc) => doc.category === "pdf-document"
      );

      // Process PDF documents
      const documents = {};
      pdfDocTypes.forEach((docType) => {
        const pdfDoc = team.pdfDocuments?.[docType.key] || {};
        documents[docType.key] = {
          name: docType.name,
          description: docType.description,
          status: pdfDoc.status || "not_submitted",
          uploaded: Boolean(pdfDoc.uploadedAt),
          uploadedAt: pdfDoc.uploadedAt,
          uploadedBy: pdfDoc.uploadedBy,
          originalName: pdfDoc.originalName,
          filename: pdfDoc.filename,
          size: pdfDoc.size,
          mentorApproved: pdfDoc.mentorApproval || false,
          adminApproved: pdfDoc.adminApproval || false,
          rejectionReason: pdfDoc.rejectionReason,
          requiredForApproval: docType.requiredForApproval,
        };
      });

      res.status(200).json({
        team: {
          _id: team._id,
          code: team.code,
          leader: team.leader,
          members: team.members,
        },
        isLeader,
        documents,
        documentTypes: pdfDocTypes,
      });
    } catch (error) {
      console.error("Error fetching team documents:", error);
      res.status(500).json({
        message: "Failed to fetch documents",
        error: error.message,
      });
    }
  })
);

// Middleware to attach team code before multer processes the file
const attachTeamCode = asyncHandler(async (req, res, next) => {
  const student = await User.findById(req.user._id);
  if (student?.studentData?.currentTeam) {
    const team = await Team.findById(student.studentData.currentTeam).select(
      "code"
    );
    if (team) {
      req.teamCode = team.code;
    }
  }
  next();
});

// Upload PDF document (team leader only)
router.post(
  "/my-team/upload-document/:documentType",
  authenticate,
  authorizeRoles("student"),
  attachTeamCode,
  pdfUpload.single("document"),
  asyncHandler(async (req, res) => {
    try {
      const { documentType } = req.params;
      const { DocumentTypesConfig } = require("../config/documentTypes");

      // Validate document type
      const docTypeConfig = DocumentTypesConfig.getByKey(documentType);
      if (!docTypeConfig || docTypeConfig.category !== "pdf-document") {
        return res.status(400).json({ message: "Invalid document type" });
      }

      // Find student's team
      const student = await User.findById(req.user._id);
      if (!student?.studentData?.currentTeam) {
        return res
          .status(404)
          .json({ message: "You are not part of any team" });
      }

      const team = await Team.findById(student.studentData.currentTeam);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Check if current user is the team leader
      if (team.leader.toString() !== req.user._id.toString()) {
        // Delete uploaded file if not leader
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({
          message: "Only team leader can upload documents",
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Ensure uploaded file matches expected fileType for this document type
      const uploadedExt = path.extname(req.file.originalname).toLowerCase();
      const expectedExt = `.${docTypeConfig.fileType}`;
      if (docTypeConfig.fileType && uploadedExt !== expectedExt) {
        // delete uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          message: `Expected a ${docTypeConfig.fileType.toUpperCase()} file for this document type`,
        });
      }

      // Delete old file if exists
      if (team.pdfDocuments?.[documentType]?.path) {
        const oldPath = team.pdfDocuments[documentType].path;
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Initialize pdfDocuments if not exists
      if (!team.pdfDocuments) {
        team.pdfDocuments = {};
      }

      // Update document info
      team.pdfDocuments[documentType] = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        uploadedAt: new Date(),
        uploadedBy: req.user._id,
        status: "submitted",
        mentorApproval: false,
        adminApproval: false,
      };

      await team.save();

      res.status(200).json({
        message: "Document uploaded successfully",
        document: {
          type: documentType,
          name: docTypeConfig.name,
          originalName: req.file.originalname,
          uploadedAt: team.pdfDocuments[documentType].uploadedAt,
        },
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        message: "Failed to upload document",
        error: error.message,
      });
    }
  })
);

// Download/view PDF document (all team members can view)
router.get(
  "/my-team/download-document/:documentType",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    try {
      const { documentType } = req.params;

      // Find student's team
      const student = await User.findById(req.user._id);
      if (!student?.studentData?.currentTeam) {
        return res
          .status(404)
          .json({ message: "You are not part of any team" });
      }

      const team = await Team.findById(student.studentData.currentTeam);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Get document
      const document = team.pdfDocuments?.[documentType];
      if (!document || !document.path) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if file exists
      if (!fs.existsSync(document.path)) {
        return res
          .status(404)
          .json({ message: "Document file not found on server" });
      }

      // Send file with appropriate content type based on extension
      // All served documents are PDFs
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${document.originalName}"`
      );
      res.sendFile(path.resolve(document.path));
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({
        message: "Failed to download document",
        error: error.message,
      });
    }
  })
);

// Delete PDF document (team leader only)
router.delete(
  "/my-team/delete-document/:documentType",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    try {
      const { documentType } = req.params;
      const { DocumentTypesConfig } = require("../config/documentTypes");

      // Validate document type
      const docTypeConfig = DocumentTypesConfig.getByKey(documentType);
      if (!docTypeConfig || docTypeConfig.category !== "pdf-document") {
        return res.status(400).json({ message: "Invalid document type" });
      }

      // Find student's team
      const student = await User.findById(req.user._id);
      if (!student?.studentData?.currentTeam) {
        return res
          .status(404)
          .json({ message: "You are not part of any team" });
      }

      const team = await Team.findById(student.studentData.currentTeam);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Check if current user is the team leader
      if (team.leader.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "Only team leader can delete documents",
        });
      }

      // Get document
      const document = team.pdfDocuments?.[documentType];
      if (!document || !document.path) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if document is already approved
      if (document.adminApproval) {
        return res.status(403).json({
          message: "Cannot delete an admin-approved document",
        });
      }

      // Delete file from filesystem
      if (fs.existsSync(document.path)) {
        fs.unlinkSync(document.path);
      }

      // Clear document data
      team.pdfDocuments[documentType] = {
        status: "draft",
        mentorApproval: false,
        adminApproval: false,
      };

      await team.save();

      res.status(200).json({
        message: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({
        message: "Failed to delete document",
        error: error.message,
      });
    }
  })
);

module.exports = router;
