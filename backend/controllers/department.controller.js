const Department = require("../models/departments.model");
const mongoose = require("mongoose");

/* ==============================
   GET DEPARTMENTS BY CAMPUS
============================== */
const getDepartmentsByCampus = async (req, res) => {
  try {
    const { campus_id } = req.query;

    if (!campus_id) {
      return res.status(400).json({ message: "campus_id is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(campus_id)) {
      return res.status(400).json({ message: "Invalid campus_id format." });
    }

    const departments = await Department.find({ campus_id })
      .select("name type email office_location")
      .lean();

    res.json(departments);
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDepartmentsByCampus };