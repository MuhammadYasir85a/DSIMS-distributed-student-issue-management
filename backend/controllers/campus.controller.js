const Campus = require("../models/campuses.model");

/* ==============================
   GET ALL CAMPUSES
============================== */
const getAllCampuses = async (req, res) => {
  try {
    const campuses = await Campus.find({ status: "active" })
      .select("name location");

    res.json(campuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllCampuses };