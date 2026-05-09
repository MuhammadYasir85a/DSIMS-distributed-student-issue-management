const Issue = require("../models/issues.model");
const Notification = require("../models/notifications.model");

/* ==============================
   CREATE ISSUE (Student)
============================== */
const createIssue = async (req, res) => {
  try {
    const { title, description, category, priority, department_id, is_anonymous } = req.body;

    const user = req.user;

    // ✅ 1. Validate department exists
    const department = await Department.findById(department_id);
    if (!department) {
      return res.status(400).json({ message: "Invalid department selected." });
    }

    // ✅ 2. Ensure department belongs to student's campus
    if (department.campus_id.toString() !== user.campus_id) {
      return res.status(403).json({ message: "Department not in your campus." });
    }

    const issue = await Issue.create({
      title,
      description,
      category,
      priority,
      campus_id: user.campus_id,
      student_id: user.user_id,
      department_id,
      is_anonymous: is_anonymous || false,
      updates: [
        {
          updated_by: user.user_id,
          updater_role: user.role,
          message: "Issue submitted",
          old_status: null,
          new_status: "submitted",
        },
      ],
    });

    await Notification.create({
      recipient_id: user.user_id,
      recipient_role: "student",
      issue_id: issue._id,
      message: "Your issue has been submitted successfully.",
    });

    res.status(201).json({
      message: "Issue created successfully",
      issue,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ==============================
   ADMIN VIEW DEPARTMENT ISSUES
============================== */
const getDepartmentIssues = async (req, res) => {
  try {
    const user = req.user;

    // ✅ Only department_admin can use this
    if (user.role !== "department_admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    // ✅ Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const issues = await Issue.find({
      campus_id: user.campus_id,
      department_id: user.department_id,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      page,
      limit,
      count: issues.length,
      issues,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ==============================
   ADMIN UPDATE ISSUE STATUS
============================== */
const updateIssueStatus = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { new_status } = req.body;

    const user = req.user;

    // ✅ Only department_admin can update
    if (user.role !== "department_admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    // ✅ Ensure same campus & department
    if (
      issue.campus_id.toString() !== user.campus_id ||
      issue.department_id.toString() !== user.department_id
    ) {
      return res.status(403).json({ message: "Unauthorized access to this issue." });
    }

    const oldStatus = issue.status;

    issue.status = new_status;

    // ✅ Add log
    issue.updates.push({
      updated_by: user.user_id,
      updater_role: user.role,
      message: `Status changed from ${oldStatus} to ${new_status}`,
      old_status: oldStatus,
      new_status: new_status,
    });

    await issue.save();

    // ✅ Notify student
    await Notification.create({
      recipient_id: issue.student_id,
      recipient_role: "student",
      issue_id: issue._id,
      message: `Your issue status changed to ${new_status}.`,
    });

    res.json({
      message: "Issue status updated successfully",
      issue,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ==============================
   ASSIGN ISSUE TO ADMIN
============================== */
const assignIssueToAdmin = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const user = req.user;

    if (user.role !== "department_admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    // ✅ Ensure same campus & department
    if (
      issue.campus_id.toString() !== user.campus_id ||
      issue.department_id.toString() !== user.department_id
    ) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    issue.assigned_to_admin_id = user.user_id;

    issue.updates.push({
      updated_by: user.user_id,
      updater_role: user.role,
      message: "Issue assigned to department admin",
      old_status: issue.status,
      new_status: issue.status,
    });

    await issue.save();

    res.json({
      message: "Issue assigned successfully",
      issue,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createIssue,
  getDepartmentIssues,
  updateIssueStatus,
  assignIssueToAdmin
};



