// /api/get/reports/this-month/new-members

var router = require("express").Router();

var rootDir = process.env.CWD;

var Models = require(rootDir + "/app/models/sequelize");
var WorkingGroups = Models.WorkingGroups;

var Auth = require(rootDir + "/app/configs/auth");

router.get("/:group_id", Auth.isLoggedIn, function(req, res) {
  WorkingGroups.getNewMembersByGroupId(req.params.group_id, function(
    err,
    members
  ) {
    res.send(members.length.toString());
  });
});

module.exports = router;
