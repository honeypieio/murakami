// /members/volunteer-info

var router = require("express").Router();
var async = require("async");

var rootDir = process.env.CWD;

var Members = require(rootDir + "/app/models/members");
var WorkingGroups = require(rootDir + "/app/models/working-groups");

var Auth = require(rootDir + "/app/configs/auth");

router.get("/:member_id", Auth.isLoggedIn, Auth.isVolunteerOrAdmin, function(
  req,
  res
) {
  Members.getById(req.params.member_id, function(err, member) {
    if (member[0] && !err) {
      Members.getVolInfoById(req.params.member_id, function(err, volInfo) {
        WorkingGroups.getAll(function(err, allWorkingGroups) {
          if (volInfo[0] && !err) {
            volInfo = volInfo[0];
            volInfo.lastUpdated = new Date(volInfo.lastUpdated);
            volInfo.lastUpdated =
              volInfo.lastUpdated.getDate() +
              "/" +
              (volInfo.lastUpdated.getMonth() + 1) +
              "/" +
              volInfo.lastUpdated.getFullYear();
            volInfo.availability = JSON.parse(volInfo.availability);
            volInfo.survey = JSON.parse(volInfo.survey);
            volInfo.roles = JSON.parse(volInfo.roles);
            volInfo.formattedRoles = [];

            async.each(
              volInfo.roles,
              function(role, callback) {
                if (allWorkingGroups[role.wg_id]) {
                  let formattedRole = {};
                  formattedRole.wg_id = allWorkingGroups[role.wg_id].group_id;
                  formattedRole.wg_name = allWorkingGroups[role.wg_id].name;
                  formattedRole.name = role.name;
                  callback(formattedRole);
                }
              },
              function(formattedRole) {
                if (formattedRole) {
                  volInfo.formattedRoles.push(formattedRole);
                }
              }
            );
          }

          volInfo.roles = volInfo.formattedRoles;

          res.render("members/volunteer-info", {
            member: member[0],
            volunteersActive: true,
            title: "Volunteer Info",
            volInfo: volInfo,
            allWorkingGroups: allWorkingGroups
          });
        });
      });
    } else {
      req.flash("error", "Member not found!");
      res.redirect("/members");
    }
  });
});

router.post("/:member_id", Auth.isLoggedIn, Auth.isVolunteerOrAdmin, function(
  req,
  res
) {
  Members.getById(req.params.member_id, function(err, member) {
    if (member[0] && !err) {
      WorkingGroups.getAll(function(err, allWorkingGroups) {
        var volInfo = req.body.volInfo;

        req
          .checkBody(
            "volInfo.emergencyContactRelation",
            "Please enter the emergency contact's relation to the member"
          )
          .notEmpty();
        req
          .checkBody(
            "volInfo.emergencyContactRelation",
            "Emergency contact's relation to the member must be <= 25 characters long"
          )
          .isLength({ max: 25 });

        req
          .checkBody(
            "volInfo.emergencyContactName",
            "Please enter the emergency contact's name to the member"
          )
          .notEmpty();
        req
          .checkBody(
            "volInfo.emergencyContactName",
            "Emergency contact's name must be <= 25 characters long"
          )
          .isLength({ max: 25 });

        req
          .checkBody(
            "volInfo.emergencyContactPhoneNo",
            "Please enter the emergency contact's phone number"
          )
          .notEmpty();
        req
          .checkBody(
            "volInfo.emergencyContactPhoneNo",
            "Please enter a shorter phone number (<= 15)"
          )
          .isLength({ max: 15 });

        req
          .checkBody(
            "volInfo.hoursPerWeek",
            "Please enter the agreed hours to be volunteer per week"
          )
          .notEmpty();
        req
          .checkBody(
            "volInfo.hoursPerWeek",
            "Please enter a valid integer of hours per week (>= 1 and <= 15)"
          )
          .isInt({ gt: 0, lt: 16 });

        req
          .checkBody(
            "rolesExplained",
            "Please make sure the role(s) have been explained"
          )
          .notEmpty();
        req
          .checkBody(
            "medicalDisclosed",
            "Please make sure the member has disclosed any medical conditions"
          )
          .notEmpty();
        req
          .checkBody(
            "volunteerAgreement",
            "Please make sure the member has agreed to the role(s)"
          )
          .notEmpty();
        req
          .checkBody(
            "benefitsExplained",
            "Please make sure you have explained membership benefits."
          )
          .notEmpty();

        var errors = req.validationErrors();

        volInfo.formattedRoles = [];

        if (req.body.volInfo.roles) {
          var working_groups = JSON.parse(member[0].working_groups).reduce(
            function(obj, v) {
              obj[v] = true;
              return obj;
            },
            {}
          );
          volInfo.roles = JSON.parse(req.body.volInfo.roles);

          async.each(
            volInfo.roles,
            function(role, callback) {
              if (role.wg_id && role.name) {
                if (allWorkingGroups[role.wg_id]) {
                  let formattedRole = {};
                  formattedRole.wg_id = allWorkingGroups[role.wg_id].group_id;
                  formattedRole.name = role.name;
                  working_groups[allWorkingGroups[role.wg_id].group_id] = true;
                  callback(role);
                }
              } else {
                callback(null);
              }
            },
            function(formattedRole) {
              if (formattedRole) {
                volInfo.formattedRoles.push(formattedRole);
              }
            }
          );
        }

        if (!errors && volInfo.formattedRoles.length == 0) {
          let error = {
            param: "roles",
            msg: "Please select at least one valid role",
            value: req.body.volInfo.roles
          };
          errors = [];
          errors.push(error);
        }

        var days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
        var periods = ["m", "ea", "a", "la", "e"];

        var validTimes = 0;

        if (volInfo.availability) {
          Object.keys(volInfo.availability).forEach(function(key) {
            var validDay = false;
            var validPeriod = false;
            for (let i = 0; i < days.length; i++) {
              if (key.substring(0, 3) == days[i]) {
                validDay = true;
              }
            }

            for (let i = 0; i < periods.length; i++) {
              if (
                key.substring(4, 5) == periods[i] ||
                key.substring(4, 6) == periods[i]
              ) {
                validPeriod = true;
              }
            }
            if (validDay && key.substring(3, 4) == "_" && validPeriod) {
              validTimes++;
            } else {
              delete volInfo.availability[key];
            }
          });
        }

        if (!errors && validTimes == 0) {
          let error = {
            param: "availability",
            msg: "Please tick at least one box in the availability matrix",
            value: req.body.volInfo.availability
          };
          errors = [];
          errors.push(error);
        }

        if (errors) {
          res.render("members/volunteer-info", {
            errors: errors,
            volunteersActive: true,
            title: "Volunteer Info",
            allWorkingGroups: allWorkingGroups,
            volInfo: volInfo,
            member: member[0]
          });
        } else {
          if (!volInfo.survey.skills.other) {
            delete volInfo.survey.skills.other;
          }

          volInfo.member_id = req.params.member_id;
          volInfo.roles = volInfo.formattedRoles;

          volInfo.availability = JSON.stringify(volInfo.availability);
          volInfo.survey = JSON.stringify(volInfo.survey);
          volInfo.roles = JSON.stringify(volInfo.roles);

          Members.putVolInfo(volInfo, function(err) {
            if (err) {
              req.flash("error", "Something went wrong!");
              res.render("members/volunteer-info", {
                volunteersActive: true,
                title: "Volunteer Info",
                allWorkingGroups: allWorkingGroups,
                volInfo: volInfo,
                member: member[0]
              });
            } else {
              Members.updateWorkingGroups(
                member[0].member_id,
                JSON.stringify(Object.keys(working_groups)),
                function(err) {}
              );
              req.flash("success_msg", "Volunteer info updated!");
              res.redirect("/members/volunteer-info/" + req.params.member_id);
            }
          });
        }
      });
    } else {
      req.flash("error", "Member not found!");
      res.redirect("/members");
    }
  });
});

module.exports = router;
