// /api/get/transactions

var router = require("express").Router();

router.use("/transactions", require("./transactions"));
router.use("/categories", require("./categories"));
router.use("/smp-callback", require("./smp-callback"));

module.exports = router;