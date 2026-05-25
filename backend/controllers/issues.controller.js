const mongoose = require("mongoose");
const Issue = require("../models/issues.model");
const Notification = require("../models/notifications.model");
const Department = require("../models/departments.model");

const ALLOWED_STATUSES = [
  "submitted",
  "under_review",
  "in_progress",
  "resolved",
  "closed",
  "rejected"
];

// ✅ Status transition rules (state machine)
// Defines which statuses can transition to which next statuses
const STATUS_TRANSITIONS = {
  submitted:    ["under_review", "rejected"],
  under_review: ["in_progress", "rejected"],
  in_progress: ["resolved", "rejected"],
  resolved:     ["closed", "in_progress"],   // can be reopened to in_progress
  closed:       [],                           // terminal — no further transitions
  rejected:     []                            // terminal — no further transitions
};

/* ==============================
   CREATE ISSUE (Student)
============================== */
const createIssue = async (req, res) => {
  try {
    const {
      title, description, primary_category, subcategory,
      priority, department_id, is_anonymous
    } = req.body;

    const user = req.user;

    // ✅ Validation
    if (!title || !description || !primary_category || !subcategory || !priority || !department_id) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // 🛡️ LOGIC GUARD: Title & description length sanity
    if (title.trim().length < 5 || title.trim().length > 150) {
      return res.status(400).json({ message: "Title must be between 5 and 150 characters." });
    }
    if (description.trim().length < 20) {
      return res.status(400).json({ message: "Description must be at least 20 characters for clarity." });
    }

    if (!mongoose.Types.ObjectId.isValid(department_id)) {
      return res.status(400).json({ message: "Invalid department_id." });
    }

    // ✅ Validate department exists & belongs to student's campus
    const department = await Department.findById(department_id);
    if (!department) {
      return res.status(400).json({ message: "Invalid department selected." });
    }

    if (department.campus_id.toString() !== String(user.campus_id)) {
      return res.status(403).json({ message: "Department not in your campus." });
    }

    const issue = await Issue.create({
      title: title.trim(),
      description: description.trim(),
      primary_category,
      subcategory,
      priority,
      campus_id: user.campus_id,
      student_id: user.user_id,
      department_id,
      is_anonymous: is_anonymous || false,
      updates: [{
        updated_by: user.user_id,
        updater_role: user.role,
        message: "Issue submitted",
        old_status: null,
        new_status: "submitted"
      }]
    });

    // ✅ Notification
    await Notification.create({
      recipient_id: user.user_id,
      recipient_role: "student",
      issue_id: issue._id,
      message: "Your issue has been submitted successfully."
    });

    res.status(201).json({
      message: "Issue created successfully",
      issue
    });

  } catch (error) {
    console.error("Create issue error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   STUDENT — GET MY ISSUES
============================== */
const getMyIssues = async (req, res) => {
  try {
    const user = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = { student_id: user.user_id };

    if (req.query.status) {
      // 🛡️ LOGIC GUARD: Validate status filter value
      if (!ALLOWED_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid status filter." });
      }
      filters.status = req.query.status;
    }
    if (req.query.primary_category) filters.primary_category = req.query.primary_category;

    const [issues, total] = await Promise.all([
      Issue.find(filters)
        .populate("department_id", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Issue.countDocuments(filters)
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: issues.length,
      issues
    });
  } catch (error) {
    console.error("Get my issues error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   GET SINGLE ISSUE BY ID
============================== */
const getIssueById = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(issue_id)) {
      return res.status(400).json({ message: "Invalid issue id." });
    }

    const issue = await Issue.findById(issue_id)
      .populate("department_id", "name")
      .populate("campus_id", "name")
      .lean();

    if (!issue) return res.status(404).json({ message: "Issue not found." });

    // ✅ Access control
    if (user.role === "student") {
      if (issue.student_id.toString() !== String(user.user_id)) {
        return res.status(403).json({ message: "Access denied." });
      }
    } else if (user.role === "department_admin") {
      if (
        issue.campus_id._id.toString() !== String(user.campus_id) ||
        issue.department_id._id.toString() !== String(user.department_id)
      ) {
        return res.status(403).json({ message: "Access denied." });
      }
    } else if (user.role === "management") {
      if (issue.campus_id._id.toString() !== String(user.campus_id)) {
        return res.status(403).json({ message: "Access denied." });
      }
    }
    // super_admin sees all

    // 🛡️ PRIVACY GUARD: Hide student identity if issue is anonymous
    //    (admins should not see who reported anonymous issues)
    if (issue.is_anonymous && user.role !== "super_admin") {
      delete issue.student_id;
    }

    res.json(issue);
  } catch (error) {
    console.error("Get issue error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   ADMIN — DEPARTMENT ISSUES
============================== */
const getDepartmentIssues = async (req, res) => {
  try {
    const user = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {
      campus_id: user.campus_id,
      department_id: user.department_id
    };

    if (req.query.status) {
      if (!ALLOWED_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid status filter." });
      }
      filters.status = req.query.status;
    }
    if (req.query.primary_category) filters.primary_category = req.query.primary_category;
    if (req.query.subcategory) filters.subcategory = req.query.subcategory;
    if (req.query.priority) filters.priority = req.query.priority;

    if (req.query.search) {
      // 🛡️ LOGIC GUARD: Escape regex special chars to prevent ReDoS
      const safeSearch = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filters.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } }
      ];
    }

    const [issues, total] = await Promise.all([
      Issue.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Issue.countDocuments(filters)
    ]);

    // 🛡️ PRIVACY GUARD: Mask student IDs for anonymous issues
    const safeIssues = issues.map(i => {
      if (i.is_anonymous) {
        const { student_id, ...rest } = i;
        return { ...rest, student_id: null };
      }
      return i;
    });

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: safeIssues.length,
      issues: safeIssues
    });
  } catch (error) {
    console.error("Get department issues error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   ADMIN — UPDATE ISSUE STATUS  (Enterprise-grade)
============================== */
const updateIssueStatus = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { new_status, message, resolution_summary } = req.body;
    const user = req.user;

    if (!new_status) {
      return res.status(400).json({ message: "new_status is required." });
    }

    if (!ALLOWED_STATUSES.includes(new_status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    if (!mongoose.Types.ObjectId.isValid(issue_id)) {
      return res.status(400).json({ message: "Invalid issue id." });
    }

    const issue = await Issue.findById(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    // ✅ Multi-campus + department isolation
    if (
      issue.campus_id.toString() !== String(user.campus_id) ||
      issue.department_id.toString() !== String(user.department_id)
    ) {
      return res.status(403).json({ message: "Unauthorized access to this issue." });
    }

    const oldStatus = issue.status;

    if (oldStatus === new_status) {
      return res.status(400).json({ message: "Status is already set to this value." });
    }

    // 🛡️ ENTERPRISE GUARD 1: STATE MACHINE — enforce valid transitions
    const allowedNext = STATUS_TRANSITIONS[oldStatus] || [];
    if (!allowedNext.includes(new_status)) {
      return res.status(400).json({
        message: `Invalid status transition. Cannot move from '${oldStatus}' to '${new_status}'. Allowed next: [${allowedNext.join(", ") || "none — terminal state"}].`
      });
    }

    // 🛡️ ENTERPRISE GUARD 2: Terminal states cannot be modified
    if (["closed", "rejected"].includes(oldStatus)) {
      return res.status(400).json({
        message: `This issue is already in a terminal state ('${oldStatus}') and cannot be changed.`
      });
    }

    // 🛡️ ENTERPRISE GUARD 3: Resolving requires detailed summary (30+ chars)
    if (new_status === "resolved") {
      if (!resolution_summary || resolution_summary.trim().length < 30) {
        return res.status(400).json({
          message: "Resolution summary is required and must be at least 30 characters explaining how the issue was resolved."
        });
      }
      // Save into existing resolution_summary field (already in your schema)
      issue.resolution_summary = resolution_summary.trim();
    }

    // 🛡️ ENTERPRISE GUARD 4: Rejecting requires clear reason (20+ chars)
    if (new_status === "rejected") {
      if (!message || message.trim().length < 20) {
        return res.status(400).json({
          message: "A clear rejection reason (min 20 characters) is required in the 'message' field to reject an issue."
        });
      }
    }

    // 🛡️ ENTERPRISE GUARD 5: Only allow "in_progress" if issue has been assigned
    if (new_status === "in_progress" && !issue.assigned_to_admin_id) {
      return res.status(400).json({
        message: "Issue must be assigned to an admin before being marked 'in_progress'."
      });
    }

    // 🛡️ ENTERPRISE GUARD 6: Status update message length cap (prevent spam)
    if (message && message.length > 1000) {
      return res.status(400).json({ message: "Status update message cannot exceed 1000 characters." });
    }

    issue.status = new_status;

    issue.updates.push({
      updated_by: user.user_id,
      updater_role: user.role,
      message: message ? message.trim() : `Status changed from ${oldStatus} to ${new_status}`,
      old_status: oldStatus,
      new_status
    });

    await issue.save();

    // ✅ Notify student
    await Notification.create({
      recipient_id: issue.student_id,
      recipient_role: "student",
      issue_id: issue._id,
      message: new_status === "resolved"
        ? `Your issue has been marked as resolved by the admin. Please review the resolution.`
        : new_status === "rejected"
          ? `Your issue has been rejected. Reason: ${message.trim()}`
          : `Your issue status changed to ${new_status}.`
    });

    res.json({
      message: "Issue status updated successfully",
      issue
    });
  } catch (error) {
    console.error("Update status error:", error);
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

    if (!mongoose.Types.ObjectId.isValid(issue_id)) {
      return res.status(400).json({ message: "Invalid issue id." });
    }

    const issue = await Issue.findById(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    if (
      issue.campus_id.toString() !== String(user.campus_id) ||
      issue.department_id.toString() !== String(user.department_id)
    ) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    // 🛡️ LOGIC GUARD 1: Cannot assign a terminal-state issue
    if (["closed", "rejected"].includes(issue.status)) {
      return res.status(400).json({
        message: `Cannot assign an issue that is already '${issue.status}'.`
      });
    }

    // 🛡️ LOGIC GUARD 2: Prevent redundant self-assignment
    if (issue.assigned_to_admin_id && issue.assigned_to_admin_id.toString() === String(user.user_id)) {
      return res.status(400).json({
        message: "This issue is already assigned to you."
      });
    }

    // 🛡️ LOGIC GUARD 3: Auto-advance from "submitted" to "under_review" on first assignment
    let statusChanged = false;
    let oldStatus = issue.status;
    if (issue.status === "submitted") {
      issue.status = "under_review";
      statusChanged = true;
    }

    issue.assigned_to_admin_id = user.user_id;

    issue.updates.push({
      updated_by: user.user_id,
      updater_role: user.role,
      message: statusChanged
        ? "Issue assigned to department admin and moved to under_review"
        : "Issue assigned to department admin",
      old_status: oldStatus,
      new_status: issue.status
    });

    await issue.save();

    // ✅ Notify student about pickup
    await Notification.create({
      recipient_id: issue.student_id,
      recipient_role: "student",
      issue_id: issue._id,
      message: "Your issue has been picked up by the department admin and is now under review."
    });

    res.json({
      message: "Issue assigned successfully",
      issue
    });
  } catch (error) {
    console.error("Assign issue error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   STUDENT — UPDATE OWN ISSUE
   (Only allowed while status === "submitted")
============================== */
const updateOwnIssue = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const {
      title, description, primary_category, subcategory,
      priority, department_id, is_anonymous
    } = req.body;

    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(issue_id)) {
      return res.status(400).json({ message: "Invalid issue id." });
    }

    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    if (issue.student_id.toString() !== String(user.user_id)) {
      return res.status(403).json({ message: "You can only edit your own issues." });
    }

    if (issue.status !== "submitted") {
      return res.status(403).json({
        message: "This issue can no longer be edited because it is already under review by the admin."
      });
    }

    if (
      !title && !description && !primary_category && !subcategory &&
      !priority && !department_id && typeof is_anonymous === "undefined"
    ) {
      return res.status(400).json({ message: "Provide at least one field to update." });
    }

    // 🛡️ LOGIC GUARD: Length sanity checks if those fields are being changed
    if (title && (title.trim().length < 5 || title.trim().length > 150)) {
      return res.status(400).json({ message: "Title must be between 5 and 150 characters." });
    }
    if (description && description.trim().length < 20) {
      return res.status(400).json({ message: "Description must be at least 20 characters." });
    }

    if (department_id && department_id !== issue.department_id.toString()) {
      if (!mongoose.Types.ObjectId.isValid(department_id)) {
        return res.status(400).json({ message: "Invalid department_id." });
      }
      const department = await Department.findById(department_id);
      if (!department) {
        return res.status(400).json({ message: "Invalid department selected." });
      }
      if (department.campus_id.toString() !== String(user.campus_id)) {
        return res.status(403).json({ message: "Department not in your campus." });
      }
      issue.department_id = department_id;
    }

    const changedFields = [];

    if (title && title.trim() !== issue.title) {
      changedFields.push("title");
      issue.title = title.trim();
    }
    if (description && description.trim() !== issue.description) {
      changedFields.push("description");
      issue.description = description.trim();
    }
    if (primary_category && primary_category !== issue.primary_category) {
      changedFields.push("primary_category");
      issue.primary_category = primary_category;
    }
    if (subcategory && subcategory !== issue.subcategory) {
      changedFields.push("subcategory");
      issue.subcategory = subcategory;
    }
    if (priority && priority !== issue.priority) {
      changedFields.push("priority");
      issue.priority = priority;
    }
    if (typeof is_anonymous !== "undefined" && is_anonymous !== issue.is_anonymous) {
      changedFields.push("is_anonymous");
      issue.is_anonymous = is_anonymous;
    }
    if (department_id && department_id !== issue.department_id.toString()) {
      changedFields.push("department_id");
    }

    if (changedFields.length === 0) {
      return res.status(400).json({ message: "No changes detected." });
    }

    issue.updates.push({
      updated_by: user.user_id,
      updater_role: "student",
      message: `Student edited fields: ${changedFields.join(", ")}`,
      old_status: issue.status,
      new_status: issue.status
    });

    await issue.save();

    res.json({
      message: "Issue updated successfully",
      updated_fields: changedFields,
      issue
    });

  } catch (error) {
    console.error("Update own issue error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   STUDENT — DELETE OWN ISSUE
   (Only allowed while status === "submitted")
============================== */
const deleteOwnIssue = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(issue_id)) {
      return res.status(400).json({ message: "Invalid issue id." });
    }

    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    if (issue.student_id.toString() !== String(user.user_id)) {
      return res.status(403).json({ message: "You can only delete your own issues." });
    }

    if (issue.status !== "submitted") {
      return res.status(403).json({
        message: "This issue can no longer be deleted because it is already under review by the admin."
      });
    }

    await Issue.deleteOne({ _id: issue_id });
    await Notification.deleteMany({ issue_id: issue._id });

    res.json({
      message: "Issue deleted successfully",
      deleted_issue_id: issue_id
    });

  } catch (error) {
    console.error("Delete own issue error:", error);
    res.status(500).json({ message: error.message });
  }
};


/* ==============================
   ADMIN — EDIT ISSUE DETAILS
   (Admin can fix description / category mistakes
    but CANNOT change status, student, or campus here)
============================== */
const adminEditIssue = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const {
      title, description, primary_category, subcategory,
      priority, edit_reason
    } = req.body;

    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(issue_id)) {
      return res.status(400).json({ message: "Invalid issue id." });
    }

    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    // ✅ Department + campus isolation
    if (
      issue.campus_id.toString() !== String(user.campus_id) ||
      issue.department_id.toString() !== String(user.department_id)
    ) {
      return res.status(403).json({ message: "Unauthorized access to this issue." });
    }

    // 🛡️ GUARD 1: Cannot edit closed/rejected issues (terminal states)
    if (["closed", "rejected"].includes(issue.status)) {
      return res.status(400).json({
        message: `Cannot edit an issue that is already '${issue.status}'.`
      });
    }

    // 🛡️ GUARD 2: At least one editable field must be provided
    if (!title && !description && !primary_category && !subcategory && !priority) {
      return res.status(400).json({ message: "Provide at least one field to update." });
    }

    // 🛡️ GUARD 3: Reason for edit is mandatory (accountability)
    if (!edit_reason || edit_reason.trim().length < 15) {
      return res.status(400).json({
        message: "An edit reason (min 15 characters) is required for accountability."
      });
    }

    // 🛡️ GUARD 4: Length sanity
    if (title && (title.trim().length < 5 || title.trim().length > 150)) {
      return res.status(400).json({ message: "Title must be between 5 and 150 characters." });
    }
    if (description && description.trim().length < 20) {
      return res.status(400).json({ message: "Description must be at least 20 characters." });
    }

    // ✅ Track what actually changed
    const changedFields = [];

    if (title && title.trim() !== issue.title) {
      changedFields.push("title");
      issue.title = title.trim();
    }
    if (description && description.trim() !== issue.description) {
      changedFields.push("description");
      issue.description = description.trim();
    }
    if (primary_category && primary_category !== issue.primary_category) {
      changedFields.push("primary_category");
      issue.primary_category = primary_category;
    }
    if (subcategory && subcategory !== issue.subcategory) {
      changedFields.push("subcategory");
      issue.subcategory = subcategory;
    }
    if (priority && priority !== issue.priority) {
      changedFields.push("priority");
      issue.priority = priority;
    }

    if (changedFields.length === 0) {
      return res.status(400).json({ message: "No changes detected." });
    }

    // ✅ Log in audit trail (uses updates array — already exists)
    issue.updates.push({
      updated_by: user.user_id,
      updater_role: user.role,
      message: `Admin edited fields [${changedFields.join(", ")}]. Reason: ${edit_reason.trim()}`,
      old_status: issue.status,
      new_status: issue.status
    });

    await issue.save();

    // ✅ Notify student so they know admin modified their issue
    await Notification.create({
      recipient_id: issue.student_id,
      recipient_role: "student",
      issue_id: issue._id,
      message: `An admin updated details of your issue. Fields changed: ${changedFields.join(", ")}.`
    });

    res.json({
      message: "Issue updated by admin successfully.",
      updated_fields: changedFields,
      edit_reason: edit_reason.trim(),
      issue
    });

  } catch (error) {
    console.error("Admin edit issue error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   SUPER ADMIN — DELETE RESOLVED ISSUE
   (Only resolved/closed issues can be deleted
    — never delete an open / pending issue)
============================== */
const superAdminDeleteIssue = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { delete_reason } = req.body;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(issue_id)) {
      return res.status(400).json({ message: "Invalid issue id." });
    }

    const issue = await Issue.findById(issue_id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    // 🛡️ GUARD 1: Only resolved or closed issues can be deleted
    if (!["resolved", "closed"].includes(issue.status)) {
      return res.status(403).json({
        message: `Cannot delete an issue with status '${issue.status}'. Only resolved or closed issues can be deleted by super admin. This protects students from arbitrary deletion of pending issues.`
      });
    }

    // 🛡️ GUARD 2: Reason for deletion is mandatory
    if (!delete_reason || delete_reason.trim().length < 20) {
      return res.status(400).json({
        message: "A delete reason (min 20 characters) is required for accountability."
      });
    }

    // ✅ Capture issue summary for audit log BEFORE deletion
    const auditSnapshot = {
      title: issue.title,
      student_id: issue.student_id,
      department_id: issue.department_id,
      campus_id: issue.campus_id,
      final_status: issue.status,
      deleted_by: user.user_id,
      deleted_by_role: user.role,
      delete_reason: delete_reason.trim(),
      deleted_at: new Date()
    };

    // ✅ Delete the issue and related notifications
    await Issue.deleteOne({ _id: issue_id });
    await Notification.deleteMany({ issue_id: issue._id });

    // ✅ Log deletion event as a notification to super admin team (audit trail)
    await Notification.create({
      recipient_id: user.user_id,
      recipient_role: "super_admin",
      issue_id: null,
      message: `Issue "${auditSnapshot.title}" (status: ${auditSnapshot.final_status}) was deleted. Reason: ${auditSnapshot.delete_reason}`
    });

    res.json({
      message: "Issue deleted successfully by super admin.",
      audit: auditSnapshot
    });

  } catch (error) {
    console.error("Super admin delete issue error:", error);
    res.status(500).json({ message: error.message });
  }
};



module.exports = {
  createIssue,
  getMyIssues,
  getIssueById,
  getDepartmentIssues,
  updateIssueStatus,
  assignIssueToAdmin,
  updateOwnIssue,
  deleteOwnIssue,
  adminEditIssue,          // ← new
  superAdminDeleteIssue    // ← new
};