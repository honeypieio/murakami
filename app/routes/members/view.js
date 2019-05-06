// /members/view

var router = require("express").Router();

var rootDir = process.env.CWD;

var Models = require(rootDir + "/app/models/sequelize");
var Members = Models.Members;
var WorkingGroups = Models.WorkingGroups;

var Auth = require(rootDir + "/app/configs/auth");

router.get("/:member_id", Auth.canAccessPage("members", "view"), function(
  req,
  res
) {
  Members.getById(req.params.member_id, req.user, function(err, member) {
    if (err || !member) {
      req.flash("error_msg", "Member not found!");
      res.redirect(process.env.PUBLIC_ADDRESS + "/members/manage");
    } else {
      res.render("members/view", {
        title: "View Member",
        membersActive: true,
        member: member,
        till: {
          till_id: req.query.till_id,
          group_id: req.user.working_groups[0]
        }
      });
    }
  });
});

module.exports = router;
