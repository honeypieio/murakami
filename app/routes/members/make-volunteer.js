// /members/make-volunteer

var router = require("express").Router();
var async = require("async");

var rootDir = process.env.CWD;

var Members = require(rootDir + "/app/models/members");
var Users = require(rootDir + "/app/models/users");
var Volunteers = require(rootDir + "/app/models/volunteers");

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

router.get("/:member_id", Auth.isLoggedIn, function(req, res) {
  Members.getById(req.params.member_id, req.user, function(err, member) {
    if (err || !member) {
      req.flash("error_msg", "Member not found!");
      res.redirect(process.env.PUBLIC_ADDRESS + "/members");
    } else {
      Members.getVolInfoById(req.params.member_id, function(err, volInfo) {
        if (!volInfo[0]) {
          Users.getCoordinators(req.user, function(err, coordinators) {
            Volunteers.getSignUpInfo(function(
              skills,
              contactMethods,
              roles,
              rolesGroupedByGroup,
              rolesGroupedById
            ) {
              res.render("members/make-volunteer", {
                title: "Add Volunteer (Existing Member)",
                membersActive: true,
                member: member,
                volInfo: volInfo,
                coordinators: coordinators,
                roles: rolesGroupedByGroup,
                skills: skills,
                contactMethods: contactMethods
              });
            });
          });
        } else {
          req.flash("error_msg", "Member is already a volunteer!");
          res.redirect(
            process.env.PUBLIC_ADDRESS +
              "/volunteers/view/" +
              req.params.member_id
          );
        }
      });
    }
  });
});

router.post("/:member_id", Auth.isLoggedIn, function(req, res) {
  Members.getById(req.params.member_id, req.user, function(err, member) {
    if (err || !member) {
      req.flash("error_msg", "Member not found!");
      res.redirect(process.env.PUBLIC_ADDRESS + "/members");
    } else {
      Members.getVolInfoById(req.params.member_id, function(err, volInfo) {
        if (!volInfo[0]) {
          Users.getCoordinators(req.user, function(
            err,
            coordinators,
            coordinatorsObj,
            coordinatorsFlat
          ) {
            Volunteers.getSignUpInfo(function(
              skills,
              contactMethods,
              roles,
              rolesGroupedByGroup,
              rolesGroupedById
            ) {
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
                  "volInfo.medicalDisclosed",
                  "Please make sure the member has disclosed any medical conditions"
                )
                .notEmpty();
              req
                .checkBody(
                  "volInfo.volunteerAgreementAgreed",
                  "Please agree to the volunteer agreement"
                )
                .notEmpty();

              req
                .checkBody("volInfo.roles", "Please select at least one role")
                .notEmpty();

              req
                .checkBody(
                  "volInfo.survey.goals",
                  "Please enter what the volunteer wants to achieve through their work with Shrub"
                )
                .notEmpty();

              req
                .checkBody(
                  "volInfo.survey.preferredCommMethods",
                  "Please select at least one preferred contact method"
                )
                .notEmpty();

              var errors = req.validationErrors() || [];

              var days = {
                mon: true,
                tue: true,
                wed: true,
                thu: true,
                fri: true,
                sat: true,
                sun: true
              };
              var periods = { m: true, a: true, e: true };

              var validTimes = 0;

              if (volInfo.availability) {
                Object.keys(volInfo.availability).forEach(function(key) {
                  var validDay = false;
                  var validPeriod = false;

                  if (days[key.substring(0, 3)]) {
                    validDay = true;
                  }

                  if (periods[key.substring(4, 5)]) {
                    validPeriod = true;
                  }

                  if (validDay && key.substring(3, 4) == "_" && validPeriod) {
                    validTimes++;
                  } else {
                    delete volInfo.availability[key];
                  }
                });
              }

              if (validTimes == 0) {
                let error = {
                  param: "volInfo.availability",
                  msg:
                    "Please tick at least one box in the availability matrix",
                  value: req.body.volInfo.availability
                };
                errors.push(error);
              }

              if (!Array.isArray(volInfo.assignedCoordinators)) {
                volInfo.assignedCoordinators = [volInfo.assignedCoordinators];
              }

              if (
                !Helpers.allBelongTo(
                  volInfo.assignedCoordinators,
                  coordinatorsFlat
                )
              ) {
                let error = {
                  param: "volInfo.assignedCoordinators",
                  msg: "Please select a valid staff coordinators",
                  value: req.body.volInfo.assignedCoordinators
                };

                errors.push(error);
              }

              if (volInfo.survey.skills) {
                if (!Array.isArray(volInfo.survey.skills)) {
                  volInfo.survey.skills = [volInfo.survey.skills];
                }
                if (!Helpers.allBelongTo(volInfo.survey.skills, skills)) {
                  let error = {
                    param: "volInfo.survey.skills",
                    msg: "Please select valid skills",
                    value: req.body.volInfo.survey.skills
                  };

                  errors.push(error);
                }
              }

              if (!Array.isArray(volInfo.survey.preferredCommMethods)) {
                volInfo.survey.preferredCommMethods = [
                  volInfo.survey.preferredCommMethods
                ];
              }

              if (
                !Helpers.allBelongTo(
                  volInfo.survey.preferredCommMethods,
                  contactMethods
                )
              ) {
                let error = {
                  param: "volInfo.survey.preferredCommMethods",
                  msg: "Please select valid contact methods",
                  value: req.body.volInfo.survey.preferredCommMethods
                };

                errors.push(error);
              }

              var rolesValid = true;
              if (!Array.isArray(volInfo.roles)) {
                volInfo.roles = [volInfo.roles];
              }
              async.each(
                volInfo.roles,
                function(role, callback) {
                  if (!rolesGroupedById[role]) {
                    rolesValid = false;
                  }
                  callback();
                },
                function() {
                  if (rolesValid == false) {
                    let error = {
                      param: "volInfo.roles",
                      msg: "Please select valid roles",
                      value: req.body.volInfo.roles
                    };

                    errors.push(error);
                  }
                }
              );

              if (errors[0]) {
                res.render("members/make-volunteer", {
                  errors: errors,
                  title: "Add Volunteer (Existing Member)",
                  membersActive: true,
                  volInfo: volInfo,
                  member: member,
                  coordinators: coordinators,
                  roles: rolesGroupedByGroup,
                  skills: skills,
                  contactMethods: contactMethods
                });
              } else {
                Volunteers.addExistingMember(
                  req.params.member_id,
                  volInfo,
                  function(err) {
                    if (err) {
                      
                      res.render("members/make-volunteer", {
                        errors: [{ msg: "Something went wrong!" }],
                        title: "Add Volunteer (Existing Member)",
                        membersActive: true,
                        volInfo: volInfo,
                        member: member,
                        coordinators: coordinators,
                        roles: rolesGroupedByGroup,
                        skills: skills,
                        contactMethods: contactMethods
                      });
                    } else {
                      req.flash("success_msg", "Volunteer successfully added!");
                      res.redirect(
                        process.env.PUBLIC_ADDRESS +
                          "/volunteers/view/" +
                          req.params.member_id
                      );
                    }
                  }
                );
              }
            });
          });
        } else {
          req.flash("error_msg", "Member is already a volunteer!");
          res.redirect(
            process.env.PUBLIC_ADDRESS +
              "/volunteers/view/" +
              req.params.member_id
          );
        }
      });
    }
  });
});

module.exports = router;