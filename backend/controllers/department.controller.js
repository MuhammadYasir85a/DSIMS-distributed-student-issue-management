const Department = require("../models/departments.model");

/* ==============================
   GET DEPARTMENTS BY CAMPUS
============================== */
const getDepartmentsByCampus = async (req, res) => {
  try {
    const { campus_id } = req.query;

    if (!campus_id) {
      return res.status(400).json({ message: "campus_id is required." });
    }

    const departments = await Department.find({ campus_id })
      .select("name type email");

    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDepartmentsByCampus };