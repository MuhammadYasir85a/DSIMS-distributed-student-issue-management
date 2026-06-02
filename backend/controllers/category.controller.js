const CATEGORIES = require("../utils/categories");

const getCategories = (req, res) => {
  res.json(CATEGORIES);
};

module.exports = { getCategories };