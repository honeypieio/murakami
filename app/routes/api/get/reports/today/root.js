// /api/get/reports/today

var router = require("express").Router();

router.use("/carbon-saved", require("./carbon-saved"));
router.use("/new-members", require("./new-members"));

module.exports = router;
