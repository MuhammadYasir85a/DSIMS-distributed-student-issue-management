const express = require("express");
const { getDepartmentsByCampus } = require("../controllers/department.controller");

const router = express.Router();

router.get("/", getDepartmentsByCampus);

module.exports = router;