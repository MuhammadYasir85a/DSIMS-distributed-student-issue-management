require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");

const app = express();

// Connect Database
connectDB();

// ✅ VERY IMPORTANT LINE
app.use(express.json());

// Middleware
app.use(express.json());

app.get("/", (req, res) => {
  res.send("DSIMS Backend Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const issueRoutes = require("./routes/issues.routes");
app.use("/issues", issueRoutes);


const campusRoutes = require("./routes/campus.routes");
const departmentRoutes = require("./routes/department.routes");

const reportRoutes = require("./routes/report.routes");
app.use("/reports", reportRoutes);


const adminRoutes = require("./routes/admin.routes");
app.use("/admin", adminRoutes);

app.use("/campuses", campusRoutes);
app.use("/departments", departmentRoutes);


