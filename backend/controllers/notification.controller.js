const mongoose = require("mongoose");
const Notification = require("../models/notifications.model");

/* ==============================
   GET MY NOTIFICATIONS
============================== */
const getMyNotifications = async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filters = { recipient_id: user.user_id };
    if (req.query.unread === "true") filters.is_read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("issue_id", "title status")
        .lean(),
      Notification.countDocuments(filters),
      Notification.countDocuments({ recipient_id: user.user_id, is_read: false })
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unread_count: unreadCount,
      notifications
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   UNREAD COUNT (for bell badge)
============================== */
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient_id: req.user.user_id,
      is_read: false
    });
    res.json({ unread_count: count });
  } catch (error) {
    console.error("Unread count error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   MARK SINGLE AS READ
============================== */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id." });
    }

    const notif = await Notification.findOneAndUpdate(
      { _id: id, recipient_id: req.user.user_id },
      { is_read: true },
      { new: true }
    );

    if (!notif) return res.status(404).json({ message: "Notification not found." });

    res.json({ message: "Marked as read.", notification: notif });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   MARK ALL AS READ
============================== */
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient_id: req.user.user_id, is_read: false },
      { is_read: true }
    );
    res.json({
      message: "All marked as read.",
      modified_count: result.modifiedCount
    });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   DELETE NOTIFICATION
============================== */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id." });
    }

    const notif = await Notification.findOneAndDelete({
      _id: id,
      recipient_id: req.user.user_id
    });

    if (!notif) return res.status(404).json({ message: "Notification not found." });

    res.json({ message: "Notification deleted." });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};