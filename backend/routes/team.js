const router = require("express").Router();
const asyncHandler = require("express-async-handler");
const Team = require("../models/Team");
const User = require("../models/User");
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

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

    console.log("Team data fetched:", team._id);
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
      .select("evaluation.weeklyStatus")
      .populate({
        path: "evaluation.weeklyStatus.submittedBy",
        select: "name email",
      });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.status(200).json({
      weeklyStatus: team.evaluation?.weeklyStatus || [],
    });
  })
);

router.post(
  "/weekly-status",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const {
      week,
      dateRange,
      module,
      progress,
      achievements,
      challenges,
      studentRemarks,
    } = req.body;

    // Validate required fields
    if (
      !week ||
      !dateRange ||
      !module ||
      !progress ||
      !achievements ||
      !challenges
    ) {
      return res.status(400).json({
        message:
          "Week, date range, module, progress, achievements, and challenges are required",
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
        message: "Only team members can submit weekly status",
      });
    }

    // Check if this week already has a submission
    if (!team.evaluation) {
      team.evaluation = { weeklyStatus: [] };
    }

    const existingSubmission = team.evaluation.weeklyStatus.find(
      (status) => status.week === week
    );

    if (existingSubmission) {
      return res.status(400).json({
        message: `Week ${week} status has already been submitted`,
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
      return res.status(400).json({
        message: "Selected module is not available in your role specification",
      });
    }

    // Create new weekly status entry
    const newWeeklyStatus = {
      week: parseInt(week),
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
      submittedAt: new Date(),
      submittedBy: req.user._id,
    };

    // Add to team's weekly status
    team.evaluation.weeklyStatus.push(newWeeklyStatus);

    // Sort by week number
    team.evaluation.weeklyStatus.sort((a, b) => a.week - b.week);

    await team.save();

    res.status(201).json({
      message: `Week ${week} status submitted successfully`,
      weeklyStatus: team.evaluation.weeklyStatus,
    });
  })
);

router.put(
  "/weekly-status/:week",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const { week } = req.params;
    const {
      dateRange,
      module,
      progress,
      achievements,
      challenges,
      studentRemarks,
    } = req.body;

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

    // Find the weekly status to update
    const weeklyStatusIndex = team.evaluation?.weeklyStatus?.findIndex(
      (status) => status.week === parseInt(week)
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

    team.evaluation.weeklyStatus[weeklyStatusIndex] = updatedStatus;

    await team.save();

    res.status(200).json({
      message: `Week ${week} status updated successfully`,
      weeklyStatus: team.evaluation.weeklyStatus,
    });
  })
);

module.exports = router;
