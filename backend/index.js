const express = require("express");
const hpp = require("hpp");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const compression = require("compression");

const connectDB = require("./config/db");
const errorManager = require("./middleware/errorManager");
const fixedUsers = require("./middleware/fixedUsers");
const auth = require("./routes/auth");
const admin = require("./routes/admin");
const common = require("./routes/common");
const team = require("./routes/team");

// Validate required environment variables
function validateEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const required = [
    "MONGO_URI",
    "JWT_SECRET",
    "JWT_EXPIRE",
    "EMAIL_USER",
    "EMAIL_PASS",
    "ADMIN_EMAIL",
    "ADMIN_PASS",
    "DEFAULT_PASS",
  ];
  if (isProd) {
    required.push("CLIENT_URL");
  }
  const missing = required.filter(
    (k) => !process.env[k] || process.env[k].trim() === "",
  );
  if (missing.length > 0) {
    console.error(
      "Missing required environment variables:",
      missing.join(", "),
    );
    process.exit(1);
  }
}

validateEnv();

// CORS configuration with allowlist support
const allowlist = (
  process.env.CLIENT_URLS ||
  process.env.CLIENT_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const isProd = process.env.NODE_ENV === "production";

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // server-to-server or curl
    if (!isProd) {
      // In development, reflect any origin to eliminate CORS friction
      return callback(null, true);
    }
    if (allowlist.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  // Let cors reflect requested headers to avoid mismatches on case/unknown headers
  // allowedHeaders intentionally omitted
  credentials: true,
  optionsSuccessStatus: 200,
};

connectDB()
  .then(() => {
    fixedUsers();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const app = express();

// Trust proxy for secure cookies behind reverse proxies
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Security middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // disable if you have inline scripts or dynamic sources, else configure it
  }),
);
// Prevent MongoDB operator injection ($/.) in inputs (Express 5-safe)
const sanitizeNoSQL = (obj) => {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }
    if (val && typeof val === "object") sanitizeNoSQL(val);
  }
};
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(compression()); // Compress response bodies for better performance

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use(cors(corsOptions));
// Generic preflight responder for Express 5
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Rate limiting (to prevent brute-force attacks)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Core middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
// Sanitize after parsing
app.use((req, _res, next) => {
  sanitizeNoSQL(req.body);
  // req.query is a read-only getter in Express 5; sanitize the underlying URLSearchParams instead
  // We avoid mutating req.query directly; params are safe as provided by router
  if (req.params) sanitizeNoSQL(req.params);
  next();
});
app.use(cookieParser());

// Health check endpoint (before auth routes, not rate-limited)
app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Routes
app.use("/auth", auth);
app.use("/admin", admin);
app.use("/common", common);
app.use("/team", team);

// Error handler
app.use(errorManager);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}!`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      const mongoose = require("mongoose");
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
    } catch (e) {
      // ignore
    } finally {
      process.exit(0);
    }
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
