const router = require("express").Router();
const asyncHandler = require("express-async-handler");

const User = require("../models/User");
const Team = require("../models/Team");
const Project = require("../models/ProjectBank");
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

router.get(
  "/project-bank",
  authenticate,
  asyncHandler(async (_, res) => {
    const projects = await Project.find({
      isApproved: true,
      rejectedAt: null,
    })
      .populate("proposedBy", "-password")
      .lean({ virtuals: true });

    // Filter by virtual isAvailable (assignedTeams.length < maxTeams)
    const availableProjects = projects.filter(
      (project) => project.assignedTeams.length < project.maxTeams
    );

    // console.log("Fetched project bank:", availableProjects.length, availableProjects);

    res.status(200).json(availableProjects);
  })
);

router.get(
  "/my-proposed-projects",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const projects = await Project.find({
      proposedBy: req.user._id,
    })
      .populate("feedback.byUser", "name")
      .sort({ createdAt: -1 });
    res.status(200).json(projects);
  })
);

router.get(
  "/mentors",
  authenticate,
  asyncHandler(async (req, res) => {
    const mentors = await User.find({ role: "mentor" }, "_id name email");
    res.status(200).json(mentors);
  })
);

router.get(
  "/teams",
  authenticate,
  authorizeRoles("mentor"),
  asyncHandler(async (req, res) => {
    const allTeams = await Team.find({
      "mentor.preferences": req.user._id,
      status: "approved",
      $or: [
        { "mentor.assigned": null },
        { "mentor.assigned": { $exists: false } },
      ],
    })
      .select("_id code leader members projectChoices mentor")
      .populate("leader", "_id name email")
      .populate("members.student", "_id name email")
      .populate("projectChoices", "_id title description category")
      .lean();

    const teams = allTeams.filter((team) => {
      const currPrefIndex = team.mentor?.currentPreference;
      const prefId = team.mentor?.preferences?.[currPrefIndex]?.toString();
      const userId = req.user._id.toString();
      return prefId === userId;
    });

    if (!teams || teams.length === 0) {
      return res.status(404).json({ message: "No teams to approve." });
    }
    const formatTeams = teams.map((team) => {
      return {
        _id: team._id,
        code: team.code,
        leader: team.leader,
        members: team.members.map((m) => m.student),
        projectChoices: team.projectChoices,
      };
    });
    console.log("Fetched teams for mentor:", teams.length, formatTeams);

    res.status(200).json(formatTeams);
  })
);

// Helper for mentor validation
function isCurrentMentor(team, userId) {
  return (
    team.mentor.preferences &&
    team.mentor.preferences[team.mentor.currentPreference]?.toString() ===
      userId.toString()
  );
}

router.post(
  "/create-team",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const { projectChoices, mentorChoices } = req.body;
    if (!projectChoices || !mentorChoices) {
      return res.status(400).json({ message: "All fields are required." });
    }
    // Generate a unique team code
    let code;
    let exists = true;
    while (exists) {
      code = Math.random().toString(36).slice(2, 8).toUpperCase();
      exists = await Team.exists({ code });
    }
    const existingTeam = await Team.findOne({ code });
    if (existingTeam) {
      return res
        .status(400)
        .json({ message: "Team with this code already exists." });
    }
    const newTeam = new Team({
      code,
      leader: req.user._id,
      projectChoices,
      mentor: {
        preferences: mentorChoices,
      },
      batch: req.user.studentData.batch,
      department: req.user.studentData.department,
    });

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Set current team for the user
    user.studentData.currentTeam = newTeam._id;

    await user.save();
    await newTeam.save();
    console.log(newTeam);

    res
      .status(201)
      .json({ message: "Team created successfully.", team: newTeam });
  })
);

router.post(
  "/join-team",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Team code is required." });
    }
    const team = await Team.findOne({ code });
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }
    if (team.members.length >= 3) {
      return res.status(400).json({ message: "Team is full." });
    }
    if (req.user.studentData.currentTeam) {
      return res
        .status(400)
        .json({ message: "You are already part of a team." });
    }
    if (team.batch !== req.user.studentData.batch) {
      return res
        .status(400)
        .json({ message: "Your batch does not match the team's batch." });
    }
    if (team.department !== req.user.studentData.department) {
      return res.status(400).json({
        message: "Your department does not match the team's department.",
      });
    }

    // Get the actual user document from database
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Add user to team members
    team.members.push({ student: req.user._id });

    // Update user's currentTeam
    user.studentData.currentTeam = team._id;

    await team.save();
    await user.save();

    res.status(200).json({ message: "You have joined the team successfully." });
  })
);

router.post(
  "/propose-project",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    let { title, description, category } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ message: "All fields are required." });
    }
    title = title.trim();
    description = description.trim();
    category = category.trim();
    // Case-insensitive duplicate check
    const existingProject = await Project.findOne({
      title: { $regex: `^${title}$`, $options: "i" },
    });
    if (existingProject) {
      return res
        .status(400)
        .json({ message: "A project with this title already exists." });
    }
    try {
      const newProject = new Project({
        title,
        description,
        category,
        proposedBy: req.user._id,
      });
      await newProject.save();
      res.status(201).json({
        message: "Project proposed. Please wait for admin to respond.",
        project: {
          _id: newProject._id,
          title: newProject.title,
          description: newProject.description,
          category: newProject.category,
        },
      });
    } catch (err) {
      res.status(500).json({
        message: "Failed to propose project. Please try again later.",
      });
    }
  })
);

router.put(
  "/update-proposed-project/:id",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    let { title, description, category } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ message: "All fields are required." });
    }

    title = title.trim();
    description = description.trim();
    category = category.trim();

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Check if the project belongs to the current user
    if (project.proposedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own projects." });
    }

    // Check if project is already approved
    if (project.isApproved) {
      return res
        .status(400)
        .json({ message: "Cannot edit approved projects." });
    }

    // Check for duplicate title (excluding current project)
    const existingProject = await Project.findOne({
      title: { $regex: `^${title}$`, $options: "i" },
      _id: { $ne: req.params.id },
    });
    if (existingProject) {
      return res
        .status(400)
        .json({ message: "A project with this title already exists." });
    }

    try {
      project.title = title;
      project.description = description;
      project.category = category;
      await project.save();

      res.status(200).json({
        message: "Project updated successfully.",
        project: {
          _id: project._id,
          title: project.title,
          description: project.description,
          category: project.category,
        },
      });
    } catch (err) {
      res.status(500).json({
        message: "Failed to update project. Please try again later.",
      });
    }
  })
);

router.post(
  "/withdraw-project/:id",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Check if the project belongs to the current user
    if (project.proposedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only withdraw your own projects." });
    }

    // Check if project is already approved
    if (project.isApproved) {
      return res
        .status(400)
        .json({ message: "Cannot withdraw approved projects." });
    }

    try {
      await Project.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Project withdrawn successfully." });
    } catch (err) {
      res.status(500).json({
        message: "Failed to withdraw project. Please try again later.",
      });
    }
  })
);

router.post(
  "/leave-team",
  authenticate,
  authorizeRoles("student"),
  asyncHandler(async (req, res) => {
    const teamId = req.user.studentData.currentTeam;
    if (!teamId) {
      return res.status(400).json({ message: "You are not part of any team." });
    }
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }

    // Get the actual user document from database
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // If the user is the leader
    if (team.leader.toString() === req.user._id.toString()) {
      // Update leader's studentData.currentTeam to null
      user.studentData.currentTeam = null;
      await user.save();

      // If no members left, delete the whole team
      if (team.members.length === 0) {
        const project = await Project.findById(team.finalProject);
        if (project) {
          // Remove team from project's assignedTeams
          project.assignedTeams = project.assignedTeams.filter(
            (id) => id.toString() !== teamId.toString()
          );
          await project.save();
        }
        const mentor = await User.findById(team.mentor.assigned);
        if (mentor) {
          // Remove team from mentor's mentorData.assignedTeams
          mentor.mentorData.assignedTeams =
            mentor.mentorData.assignedTeams.filter(
              (id) => id.toString() !== teamId.toString()
            );
          await mentor.save();
        }
        await Team.deleteOne({ _id: teamId });
        return res.status(200).json({
          message: "Team has been deleted as no members remain.",
        });
      }

      // Set the leader to be the first element of the members array
      const newLeader = team.members[0];
      team.leader = newLeader.student;

      // Remove the first element from members array
      team.members.splice(0, 1);

      await team.save();
      return res.status(200).json({
        message:
          "You have left the team. Leadership transferred to the next member.",
      });
    }

    // If the user is a member
    const memberIndex = team.members.findIndex(
      (member) => member.student.toString() === req.user._id.toString()
    );
    if (memberIndex === -1) {
      return res
        .status(400)
        .json({ message: "You are not a member of this team." });
    }

    // Remove the member from the members array
    team.members.splice(memberIndex, 1);

    // Update the user's studentData.currentTeam to null
    user.studentData.currentTeam = null;

    await team.save();
    await user.save();

    res.status(200).json({ message: "You have left the team." });
  })
);

router.post(
  "/accept-team",
  authenticate,
  authorizeRoles("mentor"),
  asyncHandler(async (req, res) => {
    const { teamId, finalProject, feedback } = req.body;
    if (!teamId || !finalProject) {
      return res
        .status(400)
        .json({ message: "Team ID and final project are required." });
    }
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }
    if (team.mentor.assigned) {
      return res
        .status(400)
        .json({ message: "Team already has a mentor assigned." });
    }
    // Validate that the current mentor preference is this user
    if (!isCurrentMentor(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not the current mentor for this team." });
    }
    // Check if finalProject is one of the projectChoices
    if (!team.projectChoices.map((p) => p.toString()).includes(finalProject)) {
      return res.status(400).json({
        message: "Selected project is not among the team's project choices.",
      });
    }
    const project = await Project.findById(finalProject);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }
    if (!project.isApproved) {
      return res.status(400).json({ message: "Project is not approved yet." });
    }
    if (project.assignedTeams.length >= project.maxTeams) {
      return res
        .status(400)
        .json({ message: "Project has reached its maximum team limit." });
    }
    const mentor = await User.findById(req.user._id);
    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found." });
    }
    // Update team fields
    team.mentor.assigned = mentor._id;
    team.mentor.assignedAt = Date.now();
    team.finalProject = finalProject;
    project.assignedTeams.push(team._id);
    if (feedback) {
      team.feedback.push({ message: feedback, byUser: mentor._id });
    }
    // Use a session for atomicity
    const session = await Team.startSession();
    session.startTransaction();
    try {
      await team.save({ session });
      // Use $addToSet to avoid duplicates
      await User.updateOne(
        { _id: mentor._id },
        { $addToSet: { "mentorData.assignedTeams": team._id } },
        { session }
      );
      await project.save({ session });
      await session.commitTransaction();
      await session.endSession();
      res.status(200).json({ message: "Team accepted successfully." });
    } catch (err) {
      await session.abortTransaction();
      await session.endSession();
      console.error("Error accepting team:", err);
      res
        .status(500)
        .json({
          message: "Failed to accept team. Please try again later.",
          error: err.message,
        });
    }
  })
);

router.post(
  "/reject-team",
  authenticate,
  authorizeRoles("mentor"),
  asyncHandler(async (req, res) => {
    const { teamId, feedback } = req.body;
    if (!teamId) {
      return res.status(400).json({ message: "Team ID is required." });
    }
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }
    // Validate that the current mentor preference is this user
    if (!isCurrentMentor(team, req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not the current mentor for this team." });
    }
    // Add feedback if provided
    if (feedback) {
      team.feedback.push({ message: feedback, byUser: req.user._id });
    }
    // Move to next mentor preference or set to -1 if out of range
    if (
      typeof team.mentor.currentPreference === "number" &&
      team.mentor.currentPreference < team.mentor.preferences.length - 1
    ) {
      team.mentor.currentPreference += 1;
    } else if (
      typeof team.mentor.currentPreference === "number" &&
      team.mentor.currentPreference >= team.mentor.preferences.length - 1
    ) {
      team.mentor.currentPreference = -1; // Sentinel value for no more mentors
    }
    await team.save();
    res
      .status(200)
      .json({ message: "Team rejected. Moved to next mentor preference." });
  })
);

// Get document review status for mentor's assigned teams
router.get(
  "/mentor/document-review-status",
  authenticate,
  authorizeRoles("mentor"),
  asyncHandler(async (req, res) => {
    try {
      const { DocumentTypesConfig } = require("../config/documentTypes");

      // Find teams where this mentor is assigned
      const teams = await Team.find({ "mentor.assigned": req.user._id })
        .select(
          "code leader members projectAbstract roleSpecification evaluation pdfDocuments status mentor finalProject batch department createdAt"
        )
        .populate("leader", "name email studentData.rollNumber")
        .populate("members.student", "name email studentData.rollNumber")
        .populate("finalProject", "title category")
        .populate(
          "roleSpecification.assignments.member",
          "name email studentData.rollNumber"
        )
        .lean({ virtuals: true });

      // Get dynamic document types configuration
      const documentTypes = DocumentTypesConfig.getEnabled();

      // Process teams to create document review structure
      const processedTeams = teams.map((team) => {
        const documents = {};

        documentTypes.forEach((docType) => {
          if (docType.key === "projectAbstract") {
            documents.projectAbstract = {
              name: docType.name,
              description: docType.description,
              status: team.projectAbstract?.status || "not_submitted",
              submitted: Boolean(team.projectAbstract?.submittedAt),
              submittedAt: team.projectAbstract?.submittedAt,
              submittedBy: team.projectAbstract?.submittedBy,
              mentorApproved: team.projectAbstract?.mentorApproval || false,
              adminApproved: team.projectAbstract?.adminApproval || false,
              hasData: Boolean(
                team.projectAbstract?.projectTrack ||
                  team.projectAbstract?.githubRepo ||
                  team.projectAbstract?.tools?.length ||
                  team.projectAbstract?.modules?.length
              ),
              requiredForApproval: docType.requiredForApproval,
              // Include full form data mapped from actual schema fields
              data: team.projectAbstract
                ? {
                    projectTitle: team.finalProject?.title || "N/A",
                    projectTrack: team.projectAbstract.projectTrack || "N/A",
                    projectCategory: team.finalProject?.category || "N/A",
                    numberOfModules: team.projectAbstract.modules?.length || 0,
                    githubRepo: team.projectAbstract.githubRepo || "",
                    tools: team.projectAbstract.tools || [],
                    modules:
                      team.projectAbstract.modules?.map((m) => ({
                        moduleName: m.name,
                        description: m.functionality || m.description || "",
                      })) || [],
                    teamMembers: [],
                    objectives: "",
                    scopeOfWork: "",
                  }
                : null,
            };
          } else if (docType.key === "roleSpecification") {
            documents.roleSpecification = {
              name: docType.name,
              description: docType.description,
              status: team.roleSpecification?.status || "not_submitted",
              submitted: Boolean(team.roleSpecification?.submittedAt),
              submittedAt: team.roleSpecification?.submittedAt,
              submittedBy: team.roleSpecification?.submittedBy,
              mentorApproved: team.roleSpecification?.mentorApproval || false,
              adminApproved: team.roleSpecification?.adminApproval || false,
              hasData: Boolean(team.roleSpecification?.assignments?.length),
              requiredForApproval: docType.requiredForApproval,
              // Include full form data with populated member details
              data: team.roleSpecification?.assignments?.length
                ? {
                    projectTitle: team.finalProject?.title || "N/A",
                    assignments: team.roleSpecification.assignments.map(
                      (assignment) => ({
                        memberName: assignment.member?.name || "Unknown",
                        memberEmail: assignment.member?.email || "N/A",
                        role: "Team Member",
                        responsibilities: [],
                        technologies: [],
                        modules: assignment.modules || [],
                      })
                    ),
                  }
                : null,
            };
          } else if (docType.key === "weeklyStatus") {
            const weeklyReports = team.evaluation?.weeklyStatus || [];
            documents.weeklyStatus = {
              name: docType.name,
              description: docType.description,
              totalReports: weeklyReports.length,
              submittedReports: weeklyReports.filter(
                (w) =>
                  w.status === "submitted" || w.status === "mentor_approved"
              ).length,
              approvedReports: weeklyReports.filter(
                (w) => w.status === "mentor_approved"
              ).length,
              reportsWithFiles: weeklyReports.filter(
                (w) => w.projectFile?.filename
              ).length,
              latestSubmission:
                weeklyReports.length > 0
                  ? weeklyReports[weeklyReports.length - 1].submittedAt
                  : null,
              requiredForApproval: docType.requiredForApproval,
              reports: weeklyReports.map((report) => ({
                week: report.week,
                status: report.status,
                submittedAt: report.submittedAt,
                hasFile: Boolean(report.projectFile?.filename),
                fileName: report.projectFile?.originalName,
                mentorScore: report.mentorScore,
                mentorComments: report.mentorComments,
              })),
            };
          } else if (docType.category === "pdf-document") {
            // Handle PDF documents
            const pdfDoc = team.pdfDocuments?.[docType.key] || {};
            documents[docType.key] = {
              name: docType.name,
              description: docType.description,
              status: pdfDoc.status || "not_submitted",
              submitted: Boolean(pdfDoc.uploadedAt),
              uploadedAt: pdfDoc.uploadedAt,
              uploadedBy: pdfDoc.uploadedBy,
              originalName: pdfDoc.originalName,
              filename: pdfDoc.filename,
              size: pdfDoc.size,
              mentorApproved: pdfDoc.mentorApproval || false,
              adminApproved: pdfDoc.adminApproval || false,
              requiredForApproval: docType.requiredForApproval,
              hasData: Boolean(pdfDoc.filename),
            };
          }
        });

        // Calculate completion summary
        const requiredDocs = DocumentTypesConfig.getRequiredForApproval();
        const submittedCount = Object.values(documents).filter((doc) => {
          if (doc.totalReports !== undefined) {
            return doc.totalReports > 0;
          }
          return doc.submitted;
        }).length;

        const approvedCount = Object.values(documents)
          .filter((doc) => {
            if (doc.totalReports !== undefined) {
              return doc.approvedReports > 0;
            }
            return doc.mentorApproved || doc.adminApproved;
          })
          .filter((_, index) => {
            const docKeys = Object.keys(documents);
            const docKey = docKeys[index];
            const docType = DocumentTypesConfig.getByKey(docKey);
            return docType?.requiredForApproval;
          }).length;

        return {
          _id: team._id,
          code: team.code,
          teamSize: team.teamSize,
          status: team.status,
          batch: team.batch,
          department: team.department,
          createdAt: team.createdAt,
          leader: {
            _id: team.leader._id,
            name: team.leader.name,
            email: team.leader.email,
            rollNumber: team.leader.studentData?.rollNumber,
          },
          members: team.members.map((member) => ({
            _id: member.student._id,
            name: member.student.name,
            email: member.student.email,
            rollNumber: member.student.studentData?.rollNumber,
            joinedAt: member.joinedAt,
          })),
          finalProject: team.finalProject
            ? {
                _id: team.finalProject._id,
                title: team.finalProject.title,
                category: team.finalProject.category,
              }
            : null,
          documents,
          completionSummary: {
            totalDocuments: requiredDocs.length,
            submittedDocuments: submittedCount,
            approvedDocuments: approvedCount,
          },
        };
      });

      // Calculate statistics
      const requiredDocCount =
        DocumentTypesConfig.getRequiredForApproval().length;
      const statistics = {
        totalTeams: processedTeams.length,
        teamsWithDocuments: processedTeams.filter(
          (team) => team.completionSummary.submittedDocuments > 0
        ).length,
        fullyApprovedTeams: processedTeams.filter(
          (team) =>
            team.completionSummary.approvedDocuments === requiredDocCount
        ).length,
        pendingReviewCount: processedTeams.reduce((acc, team) => {
          return (
            acc +
            Object.values(team.documents).filter(
              (doc) =>
                doc.status === "submitted" || doc.status === "mentor_approved"
            ).length
          );
        }, 0),
      };

      res.status(200).json({
        teams: processedTeams,
        documentTypes: documentTypes,
        statistics,
      });
    } catch (error) {
      console.error("Error fetching mentor document review status:", error);
      res.status(500).json({
        message: "Failed to fetch document review status",
        error: error.message,
      });
    }
  })
);

// Mentor: Download team document (only their assigned teams)
router.get(
  "/mentor/team/:teamId/document/:documentType",
  authenticate,
  authorizeRoles("mentor"),
  asyncHandler(async (req, res) => {
    try {
      const { teamId, documentType } = req.params;

      // Verify team is assigned to this mentor
      const team = await Team.findOne({
        _id: teamId,
        "mentor.assigned": req.user._id,
      });

      if (!team) {
        return res.status(404).json({
          message: "Team not found or not assigned to you",
        });
      }

      // Get document
      const document = team.pdfDocuments?.[documentType];
      if (!document || !document.path) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if file exists
      const fs = require("fs");
      const path = require("path");
      if (!fs.existsSync(document.path)) {
        return res.status(404).json({
          message: "Document file not found on server",
        });
      }

      // Send file
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

// Mentor: Get teams progress tracking data
router.get(
  "/mentor/teams-progress",
  authenticate,
  authorizeRoles("mentor"),
  asyncHandler(async (req, res) => {
    try {
      // Find teams assigned to this mentor
      const teams = await Team.find({ "mentor.assigned": req.user._id })
        .select(
          "code batch department leader members evaluation.weeklyStatus finalProject projectTimeline"
        )
        .populate("leader", "name email")
        .populate("members.student", "name email")
        .populate("finalProject", "title category")
        .populate({
          path: "evaluation.weeklyStatus.submittedBy",
          select: "name email",
        })
        .lean();

      // Format teams data with weekly status
      const formattedTeams = teams.map((team) => {
        const weeklyStatus = team.evaluation?.weeklyStatus || [];

        // Format weekly status (exclude sensitive file paths)
        const formattedWeeklyStatus = weeklyStatus.map((submission) => ({
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
          mentorScore: submission.mentorScore,
          mentorComments: submission.mentorComments,
          submittedAt: submission.submittedAt,
          submittedBy: submission.submittedBy,
          scoredAt: submission.scoredAt,
        }));

        return {
          _id: team._id,
          code: team.code,
          batch: team.batch,
          department: team.department,
          leader: team.leader,
          members: team.members,
          finalProject: team.finalProject,
          weeklyStatus: formattedWeeklyStatus,
          hasTimeline: Boolean(team.projectTimeline),
        };
      });

      res.status(200).json({
        teams: formattedTeams,
      });
    } catch (error) {
      console.error("Error fetching teams progress:", error);
      res.status(500).json({
        message: "Failed to fetch progress data",
        error: error.message,
      });
    }
  })
);

// Approve document (Mentor only)
router.put(
  "/mentor/team/:teamId/document/:documentType/approve",
  authenticate,
  authorizeRoles("mentor"),
  asyncHandler(async (req, res) => {
    const { teamId, documentType } = req.params;

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

    // Check if document exists
    if (!team.pdfDocuments?.[documentType]) {
      return res.status(404).json({ message: "Document not found" });
    }

    const document = team.pdfDocuments[documentType];

    // Check if document has been uploaded
    if (!document.path) {
      return res.status(400).json({ message: "No document uploaded yet" });
    }

    // Check if already admin approved
    if (document.status === "admin_approved") {
      return res
        .status(400)
        .json({ message: "Document is already admin approved" });
    }

    // Update document status
    document.status = "mentor_approved";
    document.mentorApproval = true;
    document.mentorApprovedBy = req.user._id;
    document.mentorApprovedAt = new Date();
    document.rejectionReason = undefined; // Clear any previous rejection reason

    await team.save();

    res.status(200).json({
      message: `Document approved successfully`,
      document: {
        type: documentType,
        status: document.status,
        mentorApproval: document.mentorApproval,
        mentorApprovedAt: document.mentorApprovedAt,
      },
    });
  })
);

// Reject document (Mentor only)
router.put(
  "/mentor/team/:teamId/document/:documentType/reject",
  authenticate,
  authorizeRoles("mentor"),
  asyncHandler(async (req, res) => {
    const { teamId, documentType } = req.params;
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

    // Check if document exists
    if (!team.pdfDocuments?.[documentType]) {
      return res.status(404).json({ message: "Document not found" });
    }

    const document = team.pdfDocuments[documentType];

    // Check if document has been uploaded
    if (!document.path) {
      return res.status(400).json({ message: "No document uploaded yet" });
    }

    // Check if already admin approved
    if (document.status === "admin_approved") {
      return res
        .status(400)
        .json({ message: "Cannot reject admin approved document" });
    }

    // Update document status
    document.status = "rejected";
    document.mentorApproval = false;
    document.mentorApprovedBy = req.user._id;
    document.mentorApprovedAt = new Date();
    document.rejectionReason = reason
      ? reason.trim()
      : "Document rejected by mentor";

    await team.save();

    res.status(200).json({
      message: `Document rejected successfully`,
      document: {
        type: documentType,
        status: document.status,
        rejectionReason: document.rejectionReason,
      },
    });
  })
);

module.exports = router;
