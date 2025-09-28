const router = require("express").Router();
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const XLSX = require("xlsx");
const csvParse = require("csv-parse/sync");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Team = require("../models/Team");
const Project = require("../models/ProjectBank");
const authorizeRoles = require("../middleware/authorizeRoles");
const authenticate = require("../middleware/authenticate");
const insertUsers = require("../middleware/fixedUsers");
const { DocumentTypesConfig } = require("../config/documentTypes");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const upload = multer({ dest: "uploads/" });

router.get(
  "/students",
  authenticate,
  authorizeRoles("admin", "sub-admin"),
  asyncHandler(async (req, res) => {
    const students = await User.find({ role: "student" })
      .lean()
      .select("-password")
      .populate("studentData.currentTeam");
    if (!students || students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }
    res.status(200).json({ students });
  })
);

router.get(
  "/mentors",
  authenticate,
  authorizeRoles("admin", "sub-admin"),
  asyncHandler(async (req, res) => {
    const mentors = await User.find({ role: { $in: ["mentor", "sub-admin"] } })
      .lean()
      .select("-password")
      .populate("mentorData.assignedTeams");
    if (!mentors || mentors.length === 0) {
      return res.status(404).json({ message: "No mentors found" });
    }
    res.status(200).json({ mentors });
  })
);

router.get(
  "/teams",
  authenticate,
  authorizeRoles("admin", "sub-admin"),
  asyncHandler(async (req, res) => {
    const teams = await Team.find({
      members: { $exists: true, $not: { $size: 0 } },
    })
      .select(
        "_id code name leader members projectChoices mentor status feedback finalProject"
      )
      .populate({
        path: "members.student",
        select: "-password",
      })
      .populate({
        path: "leader",
        select: "-password",
      })
      .populate({
        path: "mentor.assigned",
        select: "-password",
      })
      .populate({
        path: "mentor.preferences",
        select: "-password",
      })
      .populate({
        path: "projectChoices",
        select: "_id title description category",
      })
      .populate({
        path: "finalProject",
        select: "_id title description category",
      })
      .exec();

    if (!teams || teams.length === 0) {
      return res.status(404).json({ message: "No teams found" });
    }

    res.status(200).json({
      teams: teams.map((team) => ({
        ...team.toObject({ virtuals: true }),
      })),
    });
  })
);

router.get(
  "/projects",
  authenticate,
  authorizeRoles("admin", "sub-admin"),
  asyncHandler(async (req, res) => {
    const projects = await Project.find()
      .select(
        "_id title description category maxTeams assignedTeams isApproved proposedBy approvedBy feedback isAvailable rejectedAt"
      )
      .populate("proposedBy", "name email role")
      .populate("approvedBy", "name email role")
      .populate("assignedTeams", "code leader members")
      .lean({ virtuals: true });
    if (!projects || projects.length === 0) {
      return res.status(404).json({ message: "No projects found" });
    }
    res.status(200).json({ projects });
  })
);

router.post(
  "/projects",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const { title, description, category, maxTeams } = req.body;

    if (!title || !description || !category) {
      return res
        .status(400)
        .json({ message: "Title, description, and category are required." });
    }

    const newProject = new Project({
      title,
      description,
      category,
      maxTeams: maxTeams || 1,
      proposedBy: req.user._id,
      isApproved: true,
      approvedBy: req.user._id,
    });

    await newProject.save();
    res
      .status(201)
      .json({ message: "Project added successfully.", project: newProject });
  })
);

router.put(
  "/projects/:id",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, category, maxTeams } = req.body;

    if (!title || !description || !category) {
      return res
        .status(400)
        .json({ message: "Title, description, and category are required." });
    }

    const projectToUpdate = await Project.findById(id);
    if (!projectToUpdate) {
      return res.status(404).json({ message: "Project not found." });
    }

    projectToUpdate.title = title;
    projectToUpdate.description = description;
    projectToUpdate.category = category;
    projectToUpdate.maxTeams = maxTeams || projectToUpdate.maxTeams;

    await projectToUpdate.save();
    res.status(200).json({
      message: "Project updated successfully.",
      project: projectToUpdate,
    });
  })
);

router.delete(
  "/projects/:id",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (project.assignedTeams && project.assignedTeams.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete project assigned to active teams. Please unassign teams first.",
      });
    }

    await Project.findByIdAndDelete(id);
    res.status(200).json({ message: "Project deleted successfully." });
  })
);

router.post(
  "/approve-project/:id",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }
    if (project.isApproved) {
      return res.status(400).json({ message: "Project already approved." });
    }
    project.isApproved = true;
    project.approvedBy = req.user._id;

    if (feedback && !feedback !== "") {
      project.feedback.push({
        message: feedback,
        byUser: req.user._id,
        at: new Date(),
      });
    } else {
      project.feedback.push({
        message: "Project approved.",
        byUser: req.user._id,
        at: new Date(),
      });
    }
    await project.save();
    if (project.proposedBy) {
      const proposer = await User.findById(project.proposedBy).select(
        "email name"
      );
      if (proposer && proposer.email) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: proposer.email,
          subject: `Project Approved: ${project.title}`,
          text: `Dear ${proposer.name || "User"},\n\nYour project "${
            project.title
          }" has been approved by the admin team.\n\nBest regards,\nAdmin Team`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending approval email:", error);
          }
        });
      }
    }
    res.status(200).json({ message: "Project approved successfully." });
  })
);

router.post(
  "/reject-project/:id",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (project.isApproved) {
      return res.status(400).json({
        message:
          "Cannot reject an already approved project. Consider unapproving or deleting.",
      });
    }

    if (!feedback || feedback === "") {
      return res
        .status(400)
        .json({ message: "Feedback is required for rejection." });
    }

    project.isApproved = false;
    project.rejectedAt = new Date();
    project.feedback.push({
      message: feedback || "Project rejected",
      byUser: req.user._id,
      at: new Date(),
    });
    await project.save();
    if (project.proposedBy) {
      const proposer = await User.findById(project.proposedBy).select(
        "email name"
      );
      if (proposer && proposer.email) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: proposer.email,
          subject: `Project Approved: ${project.title}`,
          text: `Dear ${proposer.name || "User"},\n\nYour project "${
            project.title
          }" has been rejected by the admin team.\n\nBest regards,\nAdmin Team`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending approval email:", error);
          }
        });
      }
    }
    res.status(200).json({ message: "Project marked as rejected." });
  })
);

router.post(
  "/schedule-project-discussion",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const { projectId, dateTime } = req.body;

    if (!projectId || !dateTime) {
      return res
        .status(400)
        .json({ message: "Project ID and date/time are required." });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const meetingTime = new Date(dateTime);
    if (isNaN(meetingTime.getTime())) {
      return res.status(400).json({ message: "Invalid date/time format." });
    }

    project.feedback.push({
      message: `Discussion scheduled for ${meetingTime.toLocaleString()}`,
      byUser: req.user._id,
      at: new Date(),
    });
    await project.save();

    if (project.proposedBy) {
      const proposer = await User.findById(project.proposedBy).select(
        "email name"
      );
      if (proposer && proposer.email) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: proposer.email,
          subject: `Project Discussion Scheduled: ${project.title}`,
          text: `Dear ${proposer.name || "User"},\n\nYour project "${
            project.title
          }" has a discussion scheduled for ${meetingTime.toLocaleString()}.\n\nBest regards,\nAdmin Team`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending schedule email:", error);
          }
        });
      }
    }

    res.status(200).json({
      message: `Meeting for project '${
        project.title
      }' scheduled for ${meetingTime.toLocaleString()}.`,
    });
  })
);

router.post(
  "/register",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const {
      name,
      username,
      email,
      phone,
      role,
      studentData,
      mentorData,
      adminData,
    } = req.body;

    if (!name || !username || !email || !phone || !role) {
      return res.status(400).json({
        message: "Name, username, email, phone, and role are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }, { phone }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists (username, email, or phone)" });
    }

    let userData = {
      name,
      username,
      email,
      phone,
      role,
    };

    if (role === "student") {
      userData.studentData = studentData || {};
    } else if (role === "mentor" || role === "sub-admin") {
      userData.mentorData = mentorData || {};

      if (role === "sub-admin") {
        userData.adminData = adminData || {};
        userData.mentorData = mentorData || {};
      }
    } else if (role === "admin") {
      userData.adminData = adminData || {};
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      process.env.DEFAULT_PASS || "password123",
      salt
    );
    userData.password = hashedPassword;

    const user = new User(userData);

    await user.save();

    res
      .status(201)
      .json({ message: "User registered successfully", userId: user._id });
  })
);

router.delete(
  "/user/:id",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  })
);

router.put(
  "/user/:id",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, role, phone, username, studentData, mentorData } =
      req.body;

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }

    const newRole = role || userToUpdate.role;

    if (!["student", "mentor", "sub-admin"].includes(newRole)) {
      return res.status(400).json({
        message:
          "Updates via this route are restricted to students, mentors, or sub-admins.",
      });
    }

    let updateFields = {};

    if (name !== undefined) updateFields.name = name;
    if (email !== undefined && email !== userToUpdate.email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== id)
        return res.status(400).json({ message: "Email already in use." });
      updateFields.email = email;
    }
    if (phone !== undefined && phone !== userToUpdate.phone) {
      const existing = await User.findOne({ phone });
      if (existing && existing._id.toString() !== id)
        return res.status(400).json({ message: "Phone already in use." });
      updateFields.phone = phone;
    }
    if (username !== undefined && username !== userToUpdate.username) {
      const existing = await User.findOne({ username });
      if (existing && existing._id.toString() !== id)
        return res.status(400).json({ message: "Username already in use." });
      updateFields.username = username;
    }
    if (role !== undefined && role !== userToUpdate.role) {
      updateFields.role = role;
    }

    if (newRole === "student" && studentData) {
      Object.keys(studentData).forEach((key) => {
        if (studentData[key] !== undefined) {
          updateFields[`studentData.${key}`] = studentData[key];
        }
      });
    }

    if ((newRole === "mentor" || newRole === "sub-admin") && mentorData) {
      Object.keys(mentorData).forEach((key) => {
        if (mentorData[key] !== undefined) {
          if (key === "maxTeams") {
            updateFields[`mentorData.${key}`] = Number(mentorData[key]);
          } else {
            updateFields[`mentorData.${key}`] = mentorData[key];
          }
        }
      });
    }

    if (updateFields.role) {
      if (updateFields.role === "sub-admin") {
        updateFields["adminData.isSubAdmin"] = true;
        const empNoForAdmin =
          mentorData?.empNo || userToUpdate.mentorData?.empNo;
        const deptForAdmin =
          mentorData?.department || userToUpdate.mentorData?.department;

        if (!empNoForAdmin)
          return res.status(400).json({
            message: "Employee number required for sub-admin promotion.",
          });
        if (!deptForAdmin)
          return res
            .status(400)
            .json({ message: "Department required for sub-admin promotion." });

        updateFields["adminData.empNo"] = empNoForAdmin;
        updateFields["adminData.department"] = deptForAdmin;
        if (!userToUpdate.adminData) {
          updateFields["adminData.permissions"] = [];
        }
      } else if (
        userToUpdate.role === "sub-admin" &&
        updateFields.role === "mentor"
      ) {
        updateFields["adminData.isSubAdmin"] = false;
      }
    } else if (newRole === "sub-admin") {
      updateFields["adminData.isSubAdmin"] = true;
      const empNoForAdmin = mentorData?.empNo || userToUpdate.mentorData?.empNo;
      const deptForAdmin =
        mentorData?.department || userToUpdate.mentorData?.department;

      if (empNoForAdmin) updateFields["adminData.empNo"] = empNoForAdmin;
      else if (!userToUpdate.adminData?.empNo)
        return res
          .status(400)
          .json({ message: "Employee number missing for sub-admin." });

      if (deptForAdmin) updateFields["adminData.department"] = deptForAdmin;
      else if (!userToUpdate.adminData?.department)
        return res
          .status(400)
          .json({ message: "Department missing for sub-admin." });

      if (!userToUpdate.adminData && empNoForAdmin && deptForAdmin) {
        updateFields["adminData.permissions"] = [];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(200).json({
        message: "No updatable fields provided.",
        user: userToUpdate.toObject({ virtuals: true }),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    )
      .select("-password")
      .populate("studentData.currentTeam mentorData.assignedTeams");

    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update user." });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser.toObject({ virtuals: true }),
    });
  })
);

router.post(
  "/upload/:type",
  authenticate,
  authorizeRoles("admin"),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const collectionMap = {
      students: User,
      mentors: User,
      projects: Project,
    };
    const { type } = req.params;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const allowedExt = [".xlsx", ".csv"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.includes(ext)) {
      fs.unlinkSync(file.path);
      return res
        .status(400)
        .json({ message: "Only .xlsx or .csv files are allowed" });
    }

    if (file.size > 5 * 1024 * 1024) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: "File too large (max 5MB)" });
    }

    if (!["students", "mentors", "projects"].includes(type)) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: "Invalid type" });
    }
    let data = [];

    try {
      if (ext === ".xlsx") {
        const workbook = XLSX.readFile(file.path);
        data = [];
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(sheet);

          sheetData.forEach((row) => {
            data.push({ ...row, sheetName });
          });
        });
      } else if (ext === ".csv") {
        const fileContent = fs.readFileSync(file.path, "utf-8");
        data = csvParse.parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
        });
      }
    } catch (parseError) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        message:
          "Error parsing file. Please check the file format and content.",
        error: parseError.message,
      });
    }

    fs.unlinkSync(file.path);

    // Check if data was parsed successfully
    if (!data || data.length === 0) {
      return res.status(400).json({
        message:
          "No valid data found in the file. Please check the file format and content.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.DEFAULT_PASS, salt);

    if (type === "mentors") {
      // Filter out rows with missing required fields
      const validData = data.filter((row) => {
        return row.email && row.name && row.email.includes("@");
      });

      if (validData.length === 0) {
        return res.status(400).json({
          message:
            "No valid mentor records found. Please ensure the file contains columns: email, name, empNo, department, designation",
          total: data.length,
          processed: 0,
        });
      }

      const bulkOps = validData.map((row) => {
        const email = row.email.trim();
        const username = row.username?.trim() || email.split("@")[0].trim();
        return {
          updateOne: {
            filter: { email },
            update: {
              $set: {
                name: row.name?.trim() || "",
                username,
                email,
                phone: row.phone?.trim() || "",
                password: hashedPassword,
                role: "mentor",
                "mentorData.empNo": row.empNo?.trim() || "",
                "mentorData.department": row.department?.trim() || "",
                "mentorData.designation": row.designation?.trim() || "",
                "mentorData.maxTeams": parseInt(row.maxTeams) || 3,
              },
            },
            upsert: true,
          },
        };
      });
      if (bulkOps.length > 0) {
        await User.bulkWrite(bulkOps);
      }
      return res.status(200).json({
        message: `Mentors uploaded and processed successfully`,
        count: bulkOps.length,
        total: data.length,
        skipped: data.length - validData.length,
      });
    } else if (type === "students") {
      // Filter out rows with missing required fields
      const validData = data.filter((row) => {
        return (
          row.email && row.name && row.email.includes("@") && row.rollNumber
        );
      });

      if (validData.length === 0) {
        return res.status(400).json({
          message:
            "No valid student records found. Please ensure the file contains columns: email, name, rollNumber, batch, department",
          total: data.length,
          processed: 0,
        });
      }

      const bulkOps = validData.map((row) => {
        const email = row.email.trim();
        const username = row.username?.trim() || email.split("@")[0].trim();

        return {
          updateOne: {
            filter: { email },
            update: {
              $set: {
                name: row.name?.trim() || "",
                username,
                email,
                phone: row.phone?.trim() || "",
                password: hashedPassword,
                role: "student",
                "studentData.rollNumber": row.rollNumber?.trim() || "",
                "studentData.batch": row.batch?.trim() || "",
                "studentData.department": row.department?.trim() || "",
              },
            },
            upsert: true,
          },
        };
      });
      if (bulkOps.length > 0) {
        await User.bulkWrite(bulkOps);
      }
      return res.status(200).json({
        message: `Students uploaded and processed successfully`,
        count: bulkOps.length,
        total: data.length,
        skipped: data.length - validData.length,
      });
    } else if (type === "projects") {
      let newData = [];
      data = data.filter((row) => {
        return (
          row["__EMPTY"] &&
          row["__EMPTY"] !== "Project Name" &&
          row["__EMPTY"] !== "Problem Statements" &&
          row["__EMPTY"] !== "Problem Statement"
        );
      });
      data.forEach((row) => {
        let project = {};
        if (!row["__EMPTY_1"]) {
          let fullText = row["__EMPTY"].toString().trim();
          let problem = [];
          let delimiter = "";

          if (fullText.includes(":-")) {
            delimiter = ":-";
          } else if (fullText.includes(":")) {
            delimiter = ":";
          } else if (fullText.includes("-")) {
            delimiter = "-";
          }

          if (delimiter) {
            let index = fullText.indexOf(delimiter);
            problem[0] = fullText.slice(0, index).trim();
            problem[1] = fullText.slice(index + delimiter.length).trim();
          } else {
            problem[0] = fullText;
            problem[1] = "";
          }

          project.title = problem[0].trim();
          project.description = problem[1].trim();
        } else {
          project.title = row["__EMPTY"];
          project.description = row["__EMPTY_1"];
        }
        project.category = row["sheetName"];
        newData.push(project);
      });

      const bulkOps = newData.map((row) => {
        return {
          updateOne: {
            filter: { title: row.title },
            update: {
              $set: {
                title: row.title,
                description: row.description,
                category: row.category,
                isApproved: true,
                proposedBy: req.user._id,
                approvedBy: req.user._id,
              },
            },
            upsert: true,
          },
        };
      });
      if (bulkOps.length > 0) {
        await Project.bulkWrite(bulkOps);
      }
      return res.status(200).json({
        message: `Projects uploaded and processed successfully`,
        count: newData.length,
      });
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }
  })
);

router.post(
  "/approve/:id",
  authenticate,
  authorizeRoles("admin", "sub-admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    if (team.status === "approved") {
      return res.status(400).json({ message: "Team already approved" });
    }

    if (team.projectChoices && team.projectChoices.length > 0) {
      const projects = await Project.find({
        _id: { $in: team.projectChoices },
      });
      const notApproved = projects.find((p) => !p.isApproved);
      if (notApproved) {
        return res
          .status(400)
          .json({ message: "Either of the project is not approved yet" });
      }
    }

    team.status = "approved";

    if (feedback) {
      team.feedback.push({
        message: feedback,
        byUser: req.user._id,
      });
    }

    await team.save();
    res.status(200).json({ message: "Team approved successfully" });
  })
);

router.post(
  "/reject/:id",
  authenticate,
  authorizeRoles("admin", "sub-admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    if (team.status === "rejected") {
      return res.status(400).json({ message: "Team already rejected" });
    }
    team.status = "rejected";
    if (feedback) {
      team.feedback.push({
        message: feedback,
        byUser: req.user._id,
      });
    }
    await team.save();
    res.status(200).json({ message: "Team rejected successfully" });
  })
);

router.get(
  "/remaining-mentors",
  authenticate,
  authorizeRoles("admin", "sub-admin"),
  asyncHandler(async (req, res) => {
    const mentors = await User.find({
      role: "mentor",
      $expr: {
        $lt: [
          { $size: { $ifNull: ["$mentorData.assignedTeams", []] } },
          { $ifNull: ["$mentorData.maxTeams", 0] },
        ],
      },
    }).select("_id name email");
    res.status(200).json({ mentors });
  })
);

router.post(
  "/allocate/:team_id/:mentor_id",
  authenticate,
  authorizeRoles("admin", "sub-admin"),
  asyncHandler(async (req, res) => {
    const { team_id, mentor_id } = req.params;
    const { finalProject } = req.body;
    const team = await Team.findById(team_id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    const mentor = await User.findById(mentor_id);
    if (!mentor || mentor.role !== "mentor") {
      return res.status(404).json({ message: "Mentor not found" });
    }
    if (team.status !== "approved") {
      return res.status(400).json({ message: "Team is not approved" });
    }
    if (finalProject) {
      const project = await Project.findById(finalProject);
      if (!project || !project.isApproved) {
        return res
          .status(400)
          .json({ message: "Final project is not approved or does not exist" });
      }
      if (team.projectChoices && !team.projectChoices.includes(project._id)) {
        return res.status(400).json({
          message: "Final project must be one of the team's project choices",
        });
      }
      team.finalProject = project._id;
    }
    if (team.mentor.assigned) {
      return res.status(400).json({ message: "Team already has a mentor" });
    }
    if (mentor.mentorData.assignedTeams.length >= mentor.mentorData.maxTeams) {
      return res.status(400).json({
        message: `Mentor has already been assigned to ${mentor.mentorData.maxTeams} teams`,
      });
    }
    team.mentor.assigned = mentor._id;
    mentor.mentorData.assignedTeams.push(team._id);
    await team.save();
    await mentor.save();
    res.status(200).json({ message: "Mentor allocated successfully" });
  })
);

router.post(
  "/approve-form/:id",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { formType, feedback } = req.body;
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
  })
);

router.delete(
  "/flush-all",
  authenticate,
  authorizeRoles("admin"),
  asyncHandler(async (req, res) => {
    await Team.deleteMany({});
    await Project.deleteMany({});
    await User.deleteMany({ role: { $nin: ["dev", "admin"] } });
    await insertUsers();
    res.status(200).json({ message: "All collections deleted successfully." });
  })
);

// TTL Monitoring Route
router.get(
  "/ttl-status",
  authenticate,
  authorizeRoles("admin", "sub-admin"),
  asyncHandler(async (req, res) => {
    try {
      // Check TTL index exists
      const indexes = await Project.collection.getIndexes();
      const ttlIndex = Object.keys(indexes).find(
        (key) => indexes[key].expireAfterSeconds !== undefined
      );

      // Find expired projects that should have been deleted
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const expiredProjects = await Project.find(
        {
          rejectedAt: { $lt: twoDaysAgo, $ne: null },
        },
        "title rejectedAt"
      );

      // Get project statistics
      const totalProjects = await Project.countDocuments();
      const approvedCount = await Project.countDocuments({ isApproved: true });
      const rejectedCount = await Project.countDocuments({
        rejectedAt: { $ne: null },
      });
      const pendingCount = await Project.countDocuments({
        isApproved: false,
        rejectedAt: null,
      });

      // Get recent rejections (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentRejections = await Project.find(
        {
          rejectedAt: { $gte: sevenDaysAgo },
        },
        "title rejectedAt"
      ).sort({ rejectedAt: -1 });

      res.status(200).json({
        ttlIndex: {
          exists: !!ttlIndex,
          name: ttlIndex || null,
          expireAfterSeconds: ttlIndex
            ? indexes[ttlIndex].expireAfterSeconds
            : null,
          expireAfterDays: ttlIndex
            ? indexes[ttlIndex].expireAfterSeconds / (24 * 60 * 60)
            : null,
        },
        expiredProjects: {
          count: expiredProjects.length,
          projects: expiredProjects.map((p) => ({
            title: p.title,
            rejectedAt: p.rejectedAt,
            daysAgo: Math.floor(
              (Date.now() - new Date(p.rejectedAt).getTime()) /
                (1000 * 60 * 60 * 24)
            ),
          })),
        },
        statistics: {
          total: totalProjects,
          approved: approvedCount,
          rejected: rejectedCount,
          pending: pendingCount,
        },
        recentRejections: recentRejections.map((p) => ({
          title: p.title,
          rejectedAt: p.rejectedAt,
          daysAgo: Math.floor(
            (Date.now() - new Date(p.rejectedAt).getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        })),
      });
    } catch (error) {
      console.error("TTL Status Error:", error);
      res.status(500).json({
        message: "Error checking TTL status",
        error: error.message,
      });
    }
  })
);

// Get document review status for all teams
router.get(
  "/document-review-status",
  authenticate,
  authorizeRoles("admin", "sub-admin"),
  asyncHandler(async (req, res) => {
    try {
      const teams = await Team.find({})
        .select(
          "code leader members projectAbstract roleSpecification evaluation status mentor finalProject batch department createdAt"
        )
        .populate("leader", "name email studentData.rollNumber")
        .populate("members.student", "name email studentData.rollNumber")
        .populate("mentor.assigned", "name email")
        .populate("finalProject", "title category")
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
          }
          // Add handling for new document types here in the future
        });

        // Calculate completion summary based on enabled required documents
        const requiredDocs = DocumentTypesConfig.getRequiredForApproval();
        const submittedCount = Object.values(documents).filter((doc) => {
          if (doc.totalReports !== undefined) {
            return doc.totalReports > 0; // For weekly status
          }
          return doc.submitted;
        }).length;

        const approvedCount = Object.values(documents)
          .filter((doc) => {
            if (doc.totalReports !== undefined) {
              return doc.approvedReports > 0; // For weekly status
            }
            return doc.adminApproved;
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
          mentor: team.mentor?.assigned
            ? {
                _id: team.mentor.assigned._id,
                name: team.mentor.assigned.name,
                email: team.mentor.assigned.email,
              }
            : null,
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

      // Calculate overall statistics based on enabled documents
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
        documentTypeStats: documentTypes.map((docType) => {
          const stats = {
            name: docType.name,
            key: docType.key,
            submitted: 0,
            mentorApproved: 0,
            adminApproved: 0,
            pending: 0,
            enabled: docType.enabled,
            requiredForApproval: docType.requiredForApproval,
          };

          processedTeams.forEach((team) => {
            const doc = team.documents[docType.key];
            if (docType.key === "weeklyStatus") {
              if (doc.totalReports > 0) stats.submitted++;
              if (doc.approvedReports > 0) stats.mentorApproved++;
            } else {
              if (doc.submitted) stats.submitted++;
              if (doc.mentorApproved) stats.mentorApproved++;
              if (doc.adminApproved) stats.adminApproved++;
              if (
                doc.status === "submitted" ||
                doc.status === "mentor_approved"
              ) {
                stats.pending++;
              }
            }
          });

          return stats;
        }),
      };

      res.status(200).json({
        teams: processedTeams,
        documentTypes: documentTypes,
        statistics,
        configuration: {
          totalDocumentTypes: DocumentTypesConfig.getAll().length,
          enabledDocumentTypes: documentTypes.length,
          requiredForApproval:
            DocumentTypesConfig.getRequiredForApproval().length,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error fetching document review status:", error);
      res.status(500).json({
        message: "Failed to fetch document review status",
        error: error.message,
      });
    }
  })
);

module.exports = router;
