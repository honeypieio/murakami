// /reports

var router = require("express").Router();

var rootDir = process.env.CWD;

var Auth = require(rootDir + "/app/configs/auth");

router.get('/', Auth.isLoggedIn, function (req, res) {
	res.send("Under construction!");
});

//router.use("/add", require("./add"))

module.exports = router;