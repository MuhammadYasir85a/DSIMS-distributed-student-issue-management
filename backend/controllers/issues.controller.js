const mongoose = require("mongoose");
const Issue = require("../models/issues.model");
const Notification = require("../models/notifications.model");
const Department = require("../models/departments.model");
const Student = require("../models/students.model");
const CATEGORIES = require("../utils/categories");

const ALLOWED_STATUSES = [
  "submitted", "under_review", "in_progress",
  "resolved", "closed", "rejected"
];

const STATUS_TRANSITIONS = {
  submitted:    ["under_review", "rejected"],
  under_review: ["in_progress", "rejected"],
  in_progress:  ["resolved", "rejected"],
  resolved:     ["closed", "in_progress"],
  closed:       [],
  rejected:     []
};

const ALLOWED_SORT_FIELDS = ["createdAt", "updatedAt", "priority", "status"];

// Helper — anonymize student in lists for admins
const anonymizeIfNeeded = (issue, viewerRole) => {
  if (issue.is_anonymous && viewerRole !== "super_admin") {
    return {
      ...issue,
      student_id: { name: "Anonymous", student_id: "HIDDEN", _id: null }
    };
  }
  return issue;
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

    if (!title || !description || !primary_category || !subcategory || !priority || !department_id) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    if (title.trim().length < 5 || title.trim().length > 150) {
      return res.status(400).json({ message: "Title must be between 5 and 150 characters." });
    }
    if (description.trim().length < 20) {
      return res.status(400).json({ message: "Description must be at least 20 characters for clarity." });
    }

    // ✅ NEW: validate subcategory belongs to primary_category
    if (!CATEGORIES[primary_category] || !CATEGORIES[primary_category].includes(subcategory)) {
      return res.status(400).json({
        message: `Invalid subcategory '${subcategory}' for category '${primary_category}'.`,
        allowed_subcategories: CATEGORIES[primary_category] || []
      });
    }

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
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filters = { student_id: user.user_id };

    if (req.query.status) {
      if (!ALLOWED_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid status filter." });
      }
      filters.status = req.query.status;
    }
    if (req.query.primary_category) filters.primary_category = req.query.primary_category;

    // ✅ NEW: sort
    const sortField = ALLOWED_SORT_FIELDS.includes(req.query.sort_by) ? req.query.sort_by : "createdAt";
    const sortOrder = req.query.sort_order === "asc" ? 1 : -1;

    const [issues, total] = await Promise.all([
      Issue.find(filters)
        .populate("department_id", "name")
        .sort({ [sortField]: sortOrder })
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
      .populate("student_id", "name student_id email")           // ✅ NEW
      .populate("assigned_to_admin_id", "name email")            // ✅ NEW
      .lean();

    if (!issue) return res.status(404).json({ message: "Issue not found." });

    // Access control
    if (user.role === "student") {
      if (!issue.student_id || issue.student_id._id.toString() !== String(user.user_id)) {
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

    // Anonymize for non-super-admin viewers
    if (issue.is_anonymous && user.role !== "super_admin" && user.role !== "student") {
      issue.student_id = { name: "Anonymous", student_id: "HIDDEN", _id: null };
    }

    // ✅ NEW: tell frontend which status transitions are allowed
    issue.allowed_status_transitions = STATUS_TRANSITIONS[issue.status] || [];

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
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
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
      const safeSearch = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filters.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } }
      ];
    }

    const sortField = ALLOWED_SORT_FIELDS.includes(req.query.sort_by) ? req.query.sort_by : "createdAt";
    const sortOrder = req.query.sort_order === "asc" ? 1 : -1;

    const [issues, total] = await Promise.all([
      Issue.find(filters)
        .populate("student_id", "name student_id email")        // ✅ NEW
        .populate("assigned_to_admin_id", "name email")         // ✅ NEW
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Issue.countDocuments(filters)
    ]);

    const safeIssues = issues.map(i => anonymizeIfNeeded(i, user.role));

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
   ADMIN — UPDATE ISSUE STATUS
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

    const allowedNext = STATUS_TRANSITIONS[oldStatus] || [];
    if (!allowedNext.includes(new_status)) {
      return res.status(400).json({
        message: `Invalid status transition. Cannot move from '${oldStatus}' to '${new_status}'. Allowed next: [${allowedNext.join(", ") || "none — terminal state"}].`
      });
    }

    if (["closed", "rejected"].includes(oldStatus)) {
      return res.status(400).json({
        message: `This issue is already in a terminal state ('${oldStatus}') and cannot be changed.`
      });
    }

    if (new_status === "resolved") {
      if (!resolution_summary || resolution_summary.trim().length < 30) {
        return res.status(400).json({
          message: "Resolution summary is required and must be at least 30 characters."
        });
      }
      issue.resolution_summary = resolution_summary.trim();
    }

    if (new_status === "rejected") {
      if (!message || message.trim().length < 20) {
        return res.status(400).json({
          message: "A clear rejection reason (min 20 characters) is required."
        });
      }
    }

    if (new_status === "in_progress" && !issue.assigned_to_admin_id) {
      return res.status(400).json({
        message: "Issue must be assigned to an admin before being marked 'in_progress'."
      });
    }

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

    if (["closed", "rejected"].includes(issue.status)) {
      return res.status(400).json({
        message: `Cannot assign an issue that is already '${issue.status}'.`
      });
    }

    if (issue.assigned_to_admin_id && issue.assigned_to_admin_id.toString() === String(user.user_id)) {
      return res.status(400).json({
        message: "This issue is already assigned to you."
      });
    }

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
    if (!issue) return res.status(404).json({ message: "Issue not found." });

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

    if (title && (title.trim().length < 5 || title.trim().length > 150)) {
      return res.status(400).json({ message: "Title must be between 5 and 150 characters." });
    }
    if (description && description.trim().length < 20) {
      return res.status(400).json({ message: "Description must be at least 20 characters." });
    }

    // ✅ NEW: validate subcategory if either is being changed
    const finalPrimary = primary_category || issue.primary_category;
    const finalSub = subcategory || issue.subcategory;
    if ((primary_category || subcategory) &&
        (!CATEGORIES[finalPrimary] || !CATEGORIES[finalPrimary].includes(finalSub))) {
      return res.status(400).json({
        message: `Invalid subcategory '${finalSub}' for category '${finalPrimary}'.`,
        allowed_subcategories: CATEGORIES[finalPrimary] || []
      });
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
============================== */
const deleteOwnIssue = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(issue_id)) {
      return res.status(400).json({ message: "Invalid issue id." });
    }

    const issue = await Issue.findById(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

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
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    if (
      issue.campus_id.toString() !== String(user.campus_id) ||
      issue.department_id.toString() !== String(user.department_id)
    ) {
      return res.status(403).json({ message: "Unauthorized access to this issue." });
    }

    if (["closed", "rejected"].includes(issue.status)) {
      return res.status(400).json({
        message: `Cannot edit an issue that is already '${issue.status}'.`
      });
    }

    if (!title && !description && !primary_category && !subcategory && !priority) {
      return res.status(400).json({ message: "Provide at least one field to update." });
    }

    if (!edit_reason || edit_reason.trim().length < 15) {
      return res.status(400).json({
        message: "An edit reason (min 15 characters) is required for accountability."
      });
    }

    if (title && (title.trim().length < 5 || title.trim().length > 150)) {
      return res.status(400).json({ message: "Title must be between 5 and 150 characters." });
    }
    if (description && description.trim().length < 20) {
      return res.status(400).json({ message: "Description must be at least 20 characters." });
    }

    const finalPrimary = primary_category || issue.primary_category;
    const finalSub = subcategory || issue.subcategory;
    if ((primary_category || subcategory) &&
        (!CATEGORIES[finalPrimary] || !CATEGORIES[finalPrimary].includes(finalSub))) {
      return res.status(400).json({
        message: `Invalid subcategory '${finalSub}' for category '${finalPrimary}'.`,
        allowed_subcategories: CATEGORIES[finalPrimary] || []
      });
    }

    const changedFields = [];

    if (title && title.trim() !== issue.title) { changedFields.push("title"); issue.title = title.trim(); }
    if (description && description.trim() !== issue.description) { changedFields.push("description"); issue.description = description.trim(); }
    if (primary_category && primary_category !== issue.primary_category) { changedFields.push("primary_category"); issue.primary_category = primary_category; }
    if (subcategory && subcategory !== issue.subcategory) { changedFields.push("subcategory"); issue.subcategory = subcategory; }
    if (priority && priority !== issue.priority) { changedFields.push("priority"); issue.priority = priority; }

    if (changedFields.length === 0) {
      return res.status(400).json({ message: "No changes detected." });
    }

    issue.updates.push({
      updated_by: user.user_id,
      updater_role: user.role,
      message: `Admin edited fields [${changedFields.join(", ")}]. Reason: ${edit_reason.trim()}`,
      old_status: issue.status,
      new_status: issue.status
    });

    await issue.save();

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
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    if (!["resolved", "closed"].includes(issue.status)) {
      return res.status(403).json({
        message: `Cannot delete an issue with status '${issue.status}'. Only resolved or closed issues can be deleted.`
      });
    }

    if (!delete_reason || delete_reason.trim().length < 20) {
      return res.status(400).json({
        message: "A delete reason (min 20 characters) is required for accountability."
      });
    }

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

    await Issue.deleteOne({ _id: issue_id });
    await Notification.deleteMany({ issue_id: issue._id });

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

/* ==============================
   STUDENT — REOPEN RESOLVED ISSUE
============================== */
const reopenIssue = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(issue_id)) {
      return res.status(400).json({ message: "Invalid issue id." });
    }

    if (!reason || reason.trim().length < 20) {
      return res.status(400).json({ message: "Reopening reason required (min 20 chars)." });
    }

    const issue = await Issue.findById(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    if (issue.student_id.toString() !== String(user.user_id)) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (issue.status !== "resolved") {
      return res.status(400).json({ message: "Only resolved issues can be reopened." });
    }

    // Count past reopens from updates
    const reopenCount = issue.updates.filter(u => u.message && u.message.toLowerCase().includes("reopened")).length;
    if (reopenCount >= 3) {
      return res.status(400).json({
        message: "This issue has been reopened too many times. Please contact super admin."
      });
    }

    issue.status = "in_progress";
    issue.updates.push({
      updated_by: user.user_id,
      updater_role: "student",
      message: `Student reopened issue. Reason: ${reason.trim()}`,
      old_status: "resolved",
      new_status: "in_progress"
    });

    await issue.save();

    if (issue.assigned_to_admin_id) {
      await Notification.create({
        recipient_id: issue.assigned_to_admin_id,
        recipient_role: "department_admin",
        issue_id: issue._id,
        message: `An issue was reopened by the student. Reason: ${reason.trim()}`
      });
    }

    res.json({ message: "Issue reopened successfully", issue });
  } catch (error) {
    console.error("Reopen issue error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   STUDENT DASHBOARD STATS
============================== */
const getStudentDashboardStats = async (req, res) => {
  try {
    const user = req.user;

    const [statusCounts, recentIssues, totalCount] = await Promise.all([
      Issue.aggregate([
        { $match: { student_id: new mongoose.Types.ObjectId(user.user_id) } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Issue.find({ student_id: user.user_id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("department_id", "name")
        .select("title status priority createdAt")
        .lean(),
      Issue.countDocuments({ student_id: user.user_id })
    ]);

    const statusMap = { submitted: 0, under_review: 0, in_progress: 0, resolved: 0, closed: 0, rejected: 0 };
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      total: totalCount,
      by_status: statusMap,
      recent_issues: recentIssues
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   ADMIN DASHBOARD STATS
============================== */
const getAdminDashboardStats = async (req, res) => {
  try {
    const user = req.user;

    const baseMatch = {
      campus_id: new mongoose.Types.ObjectId(user.campus_id),
      department_id: new mongoose.Types.ObjectId(user.department_id)
    };

    const [statusCounts, priorityCounts, recentIssues, pendingStudents] = await Promise.all([
      Issue.aggregate([
        { $match: baseMatch },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Issue.aggregate([
        { $match: baseMatch },
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ]),
      Issue.find(baseMatch)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("student_id", "name student_id")
        .select("title status priority createdAt is_anonymous")
        .lean(),
      Student.countDocuments({
        campus_id: user.campus_id,
        department_id: user.department_id,
        status: "pending",
        is_email_verified: true
      })
    ]);

    const statusMap = { submitted: 0, under_review: 0, in_progress: 0, resolved: 0, closed: 0, rejected: 0 };
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });

    const priorityMap = { low: 0, medium: 0, high: 0, urgent: 0 };
    priorityCounts.forEach(p => { priorityMap[p._id] = p.count; });

    const safeRecent = recentIssues.map(i => anonymizeIfNeeded(i, user.role));

    res.json({
      by_status: statusMap,
      by_priority: priorityMap,
      pending_approvals: pendingStudents,
      recent_issues: safeRecent
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: error.message });
  }
};


/* ==============================
   SUPER ADMIN — VIEW ALL ISSUES (Read-only, cross-campus)
============================== */
const getAllIssuesSuperAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filters = {};

    // Flexible filters
    if (req.query.campus_id && mongoose.Types.ObjectId.isValid(req.query.campus_id)) {
      filters.campus_id = req.query.campus_id;
    }
    if (req.query.department_id && mongoose.Types.ObjectId.isValid(req.query.department_id)) {
      filters.department_id = req.query.department_id;
    }
    if (req.query.status) {
      if (!ALLOWED_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid status filter." });
      }
      filters.status = req.query.status;
    }
    if (req.query.priority) filters.priority = req.query.priority;
    if (req.query.primary_category) filters.primary_category = req.query.primary_category;

    if (req.query.search) {
      const safeSearch = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filters.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } }
      ];
    }

    const sortField = ALLOWED_SORT_FIELDS.includes(req.query.sort_by) ? req.query.sort_by : "createdAt";
    const sortOrder = req.query.sort_order === "asc" ? 1 : -1;

    const [issues, total] = await Promise.all([
      Issue.find(filters)
        .populate("student_id", "name student_id email")
        .populate("assigned_to_admin_id", "name email")
        .populate("department_id", "name")
        .populate("campus_id", "name")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Issue.countDocuments(filters)
    ]);

    // Anonymize
    const safeIssues = issues.map(i => {
      if (i.is_anonymous) {
        return { ...i, student_id: { name: "Anonymous", student_id: "HIDDEN", _id: null } };
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
    console.error("Get all issues error:", error);
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
  adminEditIssue,
  superAdminDeleteIssue,
  reopenIssue,                  // ✅ NEW
  getStudentDashboardStats,     // ✅ NEW
  getAdminDashboardStats,
  getAllIssuesSuperAdmin
};