const express = require("express");
const { getAllCampuses } = require("../controllers/campus.controller");

const router = express.Router();

router.get("/", getAllCampuses);

module.exports = router;