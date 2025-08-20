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

    // Update role specification
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
              status: activity.status || "pending",
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

module.exports = router;
