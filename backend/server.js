require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const app = express();

// ============================
// Database
// ============================
connectDB();

// ============================
// Global Middleware
// ============================
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(helmet());
app.use(morgan("dev"));

// ============================
// Rate Limiting
// ============================
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests, please try again later." }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many authentication attempts. Try again later." }
});

app.use(generalLimiter);

// ============================
// Health Check
// ============================
app.get("/", (req, res) => {
  res.send("DSIMS Backend Running...");
});   // ✅ FIXED: closing the route callback

// ============================
// Routes
// ============================
app.use("/auth", authLimiter, require("./routes/auth.routes"));
app.use("/issues", require("./routes/issues.routes"));
app.use("/campuses", require("./routes/campus.routes"));
app.use("/departments", require("./routes/department.routes"));
app.use("/reports", require("./routes/report.routes"));
app.use("/admin", require("./routes/admin.routes"));
app.use("/notifications", require("./routes/notification.routes"));   // ✅ NEW
app.use("/categories", require("./routes/category.routes"));          // ✅ NEW
app.use("/feedback", require("./routes/feedback.routes"));                // ✅ ADD
app.use("/admins", require("./routes/admin_management.routes"));          // ✅ ADD
app.use("/management", require("./routes/management.routes"));

// ============================
// 404 Handler
// ============================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ============================
// Global Error Handler
// ============================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

// ============================
// Start Server
// ============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});