const mongoose = require("mongoose");
const Announcement = require("../models/announcement.model");
const ResourceRequest = require("../models/resource_request.model");
const Admin = require("../models/admins.model");
const Notification = require("../models/notifications.model");

/* ==============================
   HELPER: Get campus_id of logged-in admin
============================== */
const getMyCampusId = async (userId) => {
  const admin = await Admin.findById(userId).select("campus_id role department_id").lean();
  return admin;
};

/* ============================================================
   ANNOUNCEMENTS  (Management → All Dept Admins on their campus)
============================================================ */

// Create + broadcast announcement
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, priority } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required." });
    }

    const me = await getMyCampusId(req.user.user_id);
    if (!me || me.role !== "management") {
      return res.status(403).json({ message: "Only management can send announcements." });
    }

    // Find all active dept admins on the same campus
    const recipients = await Admin.find({
      campus_id: me.campus_id,
      role: "department_admin",
      status: "active",
    }).select("_id").lean();

    // Save announcement record
    const announcement = await Announcement.create({
      sender_id: req.user.user_id,
      campus_id: me.campus_id,
      title,
      message,
      priority: priority || "normal",
      recipients_count: recipients.length,
    });

    // Push a notification to every recipient
    if (recipients.length > 0) {
      const notifDocs = recipients.map((r) => ({
        recipient_id: r._id,
        recipient_role: "department_admin",
        message: `📢 ${priority === "urgent" ? "[URGENT] " : ""}${title}: ${message}`,
        is_read: false,
      }));
      await Notification.insertMany(notifDocs);
    }

    res.status(201).json({
      message: `Announcement sent to ${recipients.length} department admin(s).`,
      announcement,
    });
  } catch (error) {
    console.error("Create announcement error:", error);
    res.status(500).json({ message: error.message });
  }
};

// List announcements I've sent (for management) — paginated
const getMyAnnouncements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = { sender_id: req.user.user_id };

    const [announcements, total] = await Promise.all([
      Announcement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Announcement.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      announcements,
    });
  } catch (error) {
    console.error("Get announcements error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ============================================================
   RESOURCE REQUESTS  (Dept Admin → Management; Mgmt approves)
============================================================ */

// Dept admin submits a new request
const createResourceRequest = async (req, res) => {
  try {
    const { request_type, title, description, priority } = req.body;

    if (!request_type || !title || !description) {
      return res.status(400).json({ message: "request_type, title and description are required." });
    }

    const me = await getMyCampusId(req.user.user_id);
    if (!me || me.role !== "department_admin") {
      return res.status(403).json({ message: "Only department admins can submit resource requests." });
    }

    const request = await ResourceRequest.create({
      requester_id: req.user.user_id,
      campus_id: me.campus_id,
      department_id: me.department_id,
      request_type,
      title,
      description,
      priority: priority || "medium",
    });

    // Notify all management on the same campus
    const managers = await Admin.find({
      campus_id: me.campus_id,
      role: "management",
      status: "active",
    }).select("_id").lean();

    if (managers.length > 0) {
      const notifDocs = managers.map((m) => ({
        recipient_id: m._id,
        recipient_role: "management",
        message: `📨 New resource request: "${title}" (${request_type})`,
        is_read: false,
      }));
      await Notification.insertMany(notifDocs);
    }

    res.status(201).json({
      message: "Resource request submitted successfully.",
      request,
    });
  } catch (error) {
    console.error("Create resource request error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Dept admin: see my own requests
const getMyResourceRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = { requester_id: req.user.user_id };
    if (req.query.status) filter.status = req.query.status;

    const [requests, total] = await Promise.all([
      ResourceRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("reviewed_by", "name email")
        .lean(),
      ResourceRequest.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      requests,
    });
  } catch (error) {
    console.error("Get my requests error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Management: see all requests on their campus
const getCampusResourceRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const me = await getMyCampusId(req.user.user_id);
    if (!me || me.role !== "management") {
      return res.status(403).json({ message: "Only management can view campus requests." });
    }

    const filter = { campus_id: me.campus_id };
    if (req.query.status) filter.status = req.query.status;

    const [requests, total] = await Promise.all([
      ResourceRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("requester_id", "name email")
        .populate("department_id", "name")
        .lean(),
      ResourceRequest.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      requests,
    });
  } catch (error) {
    console.error("Get campus requests error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Management: review (approve/reject) a request
const reviewResourceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid request id." });
    }
    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be 'approved' or 'rejected'." });
    }

    const me = await getMyCampusId(req.user.user_id);
    if (!me || me.role !== "management") {
      return res.status(403).json({ message: "Only management can review requests." });
    }

    const request = await ResourceRequest.findOne({ _id: id, campus_id: me.campus_id });
    if (!request) {
      return res.status(404).json({ message: "Request not found or not on your campus." });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: `Request is already ${request.status}.` });
    }

    request.status = decision;
    request.reviewed_by = req.user.user_id;
    request.review_remarks = remarks || "";
    request.reviewed_at = new Date();
    await request.save();

    // Notify the requester
    await Notification.create({
      recipient_id: request.requester_id,
      recipient_role: "department_admin",
      message: `Your resource request "${request.title}" was ${decision}.${remarks ? " Remarks: " + remarks : ""}`,
      is_read: false,
    });

    res.json({
      message: `Request ${decision} successfully.`,
      request,
    });
  } catch (error) {
    console.error("Review request error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAnnouncement,
  getMyAnnouncements,
  createResourceRequest,
  getMyResourceRequests,
  getCampusResourceRequests,
  reviewResourceRequest,
};