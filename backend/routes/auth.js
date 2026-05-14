const router = require("express").Router();
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const authenticate = require("../middleware/authenticate");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    let userQuery = User.findById(req.user._id).lean().select("-password");

    if (req.user.role === "student") {
      userQuery = userQuery.populate({
        path: "studentData.currentTeam",
        select: "code status leader",
        populate: {
          path: "leader",
          select: "_id name username",
        },
      });
    }

    const user = await userQuery;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    }).select("+password");

    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    

    const expiresIn = rememberMe ? "7d" : "1d";
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    };

    if (user.firstLogin) {
      return res
        .status(200)
        .cookie("token", token, cookieOptions)
        .json({ message: "Login successful", firstLogin: true, user });
    }
    res
      .status(200)
      .cookie("token", token, cookieOptions)
      .json({ message: "Login successful", user });
  })
);

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
});

router.put(
  "/me/password",
  authenticate,
  asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.firstLogin = false;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  })
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const clientURL =
      req.headers.origin || process.env.CLIENT_URL || "http://localhost:5173";
    const resetLink = `${clientURL}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `<${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Password",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
          <h2 style="color: #007BFF;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested to reset your password. Click the button below to create a new one:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; color: white; background-color: #007BFF; text-decoration: none; border-radius: 4px;">Reset Password</a>
          <p>If the button above doesn’t work, copy and paste the following link into your browser:</p>
          <p style="word-break: break-all;">${resetLink}</p>
          <hr>
          <p style="font-size: 12px; color: #777;">If you did not request a password reset, please ignore this email or contact support.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset email sent" });
  })
);

router.post(
  "/reset-password/:token",
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(payload._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  })
);

module.exports = router;
