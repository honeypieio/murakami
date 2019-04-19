// volunteers/manage

var router = require("express").Router();
var async = require("async");

var rootDir = process.env.CWD;

var Users = require(rootDir + "/app/models/users");
var Members = require(rootDir + "/app/models/members");
var Volunteers = require(rootDir + "/app/models/volunteers");
var VolunteerRoles = require(rootDir + "/app/models/volunteer-roles");
var WorkingGroups = require(rootDir + "/app/models/working-groups");

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

router.get(
  "/",
  Auth.isLoggedIn,
  Auth.canAccessPage("volunteers", "view"),
  function(req, res) {
    if (!req.query.group_id) {
      res.redirect(
        process.env.PUBLIC_ADDRESS +
          "/volunteers/manage/?group_id=" +
          req.user.working_groups[0]
      );
    } else {
      if (
        req.user.permissions.volunteers.view == true ||
        (req.user.permissions.volunteers.view == "commonWorkingGroup" &&
          req.user.working_groups.includes(req.query.group_id))
      ) {
        Volunteers.getByGroupId(req.query.group_id, req.user, function(
          err,
          volunteers
        ) {
          VolunteerRoles.getAll(function(
            err,
            roles,
            rolesGroupedByGroup,
            rolesGroupedById
          ) {
            Users.getCoordinators(req.user, function(
              err,
              coordinators,
              coordinatorsObj
            ) {
              res.render("volunteers/manage", {
                title: "Manage Volunteers",
                volunteersActive: true,
                volunteers: volunteers,
                roles: rolesGroupedById,
                coordinators: coordinatorsObj,
                group: {
                  group_id: req.query.group_id
                },
                volunteerStatus: req.query.volunteers || "all"
              });
            });
          });
        });
      } else {
        req.flash("error", "You don't belong to that working group.");
        res.redirect(process.env.PUBLIC_ADDRESS + "/volunteers/manage");
      }
    }
  }
);

module.exports = router;
