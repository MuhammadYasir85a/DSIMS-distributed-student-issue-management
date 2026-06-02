// Single source of truth for issue categories and their subcategories
const CATEGORIES = {
  campus_facility: ["projector", "ac", "furniture", "cleanliness", "parking"],
  faculty_issue: ["grading", "attendance", "behavior", "teaching_quality"],
  hostel_issue: ["water", "room", "cleaning", "food", "security"],
  electricity: ["fan", "switch", "generator", "wiring", "outage"],
  internet: ["wifi", "portal", "ethernet", "speed"],
  administration: ["fee", "documents", "id_card", "transcript"],
  examination: ["paper", "grading", "schedule", "result"],
  transport: ["bus", "route", "timing", "driver"]
};

module.exports = CATEGORIES;