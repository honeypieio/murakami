// /api/post/tills/reports

const router = require("express").Router();

router.use("/quick-summary", require("./quick-summary"));
router.use("/transactions", require("./transactions"));
router.use("/transactions-by-project", require("./transactions-by-project"));
router.use("/floats", require("./floats"));
router.use("/revenue", require("./revenue"));
router.use("/unit-sales", require("./unit-sales"));
router.use("/stock-records", require("./stock-records"));
router.use("/discounts", require("./discounts"));
router.use("/giftcard-sales", require("./giftcard-sales"));
router.use("/giftcard-redemptions", require("./giftcard-redemptions"));

module.exports = router;
