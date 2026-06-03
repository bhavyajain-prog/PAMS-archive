const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Authentication token not provided or in an invalid format.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select("-password").lean();
    if (!user) {
      // User no longer exists; clear cookie if present and respond with same error shape
      if (req.cookies && req.cookies.token) {
        const isProd = process.env.NODE_ENV === "production";
        res.clearCookie("token", {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? "none" : "lax",
        });
      }
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    if (req.cookies && req.cookies.token) {
      const isProd = process.env.NODE_ENV === "production";
      res.clearCookie("token", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
      });
    }
    res.status(403).json({ message: "Invalid or expired token." });
  }
};

module.exports = authenticate;
