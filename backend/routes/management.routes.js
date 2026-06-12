const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware"); // adjust if your middleware file name differs
const {
  createAnnouncement,
  getMyAnnouncements,
  createResourceRequest,
  getMyResourceRequests,
  getCampusResourceRequests,
  reviewResourceRequest,
} = require("../controllers/management.controller");

// All routes require login
router.use(protect);

/* Announcements (management only) */
router.post("/announcements", createAnnouncement);
router.get("/announcements", getMyAnnouncements);

/* Resource requests */
// Dept admin endpoints
router.post("/resource-requests", createResourceRequest);
router.get("/resource-requests/mine", getMyResourceRequests);

// Management endpoints
router.get("/resource-requests", getCampusResourceRequests);
router.patch("/resource-requests/:id/review", reviewResourceRequest);

module.exports = router;