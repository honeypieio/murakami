// /volunteers/check-in

var router = require("express").Router();
var async = require("async")

var rootDir = process.env.CWD;

var Users = require(rootDir + "/app/models/users");
var Members = require(rootDir + "/app/models/members");
var Volunteers = require(rootDir + "/app/models/volunteers");
var VolunteerCheckIns = require(rootDir + "/app/models/volunteer-checkins");
var VolunteerRoles = require(rootDir + "/app/models/volunteer-roles");

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");


var expectedQuestionnaire = {
                    W7cnfJVW: {
                      question_id: "W7cnfJVW",
                      question: "What’s going well and what’s not going well?"
                    },
                    DuRN9396: {
                      question_id: "DuRN9396",
                      question:
                        "Are you getting what you want from this role? Are you developing the skills you’d like to?",
                        fromInitialSurvey: "goals"
                    },
                    tfM2S2R4: {
                      question_id: "tfM2S2R4",
                      question: "Do you need any additional support?"
                    },
                    ykCcA43Z: {
                      question_id: "ykCcA43Z",
                      question: "Would you like any additional training?"
                    }
                  }


router.get("/", function(req, res) {
  res.redirect(process.env.PUBLIC_ADDRESS + "/volunteers/manage");
});

router.get(
  "/:member_id",
  Auth.isLoggedIn,
  Auth.isOfClass(["admin", "staff", "volunteer"]),
  function(req, res) {
    Members.getById(req.params.member_id, req.user, function(err, member) {
      if (err || !member) {
        req.flash("error_msg", "Member not found!");
        res.redirect(process.env.PUBLIC_ADDRESS + "/volunteers/manage");
      } else {
        Volunteers.getVolunteerById(req.params.member_id, req.user, function(
          err,
          volInfo
        ) {
          if (volInfo) {
            if (
              Helpers.hasOneInCommon(volInfo.assignedCoordinators, [
                req.user.id
              ]) ||
              Helpers.hasOneInCommon(
                member.working_groups,
                req.user.working_groups_arr
              ) ||
              req.user.class == "admin"
            ) {
              VolunteerCheckIns.getById(volInfo.checkin_id, function(
                err,
                checkin
              ) {
                Users.getAll(req.user, function(err, users, usersObj){

                  res.render("volunteers/check-in", {
                    title: "Volunteer Check-in",
                    volunteersActive: true,
                    allUsers: usersObj,
                    member: member,
                    volInfo: volInfo,
                    lastCheckIn: checkin,
                    questionnaire: expectedQuestionnaire
                  });
                })

              });
            } else {
              req.flash(
                "error_msg",
                "You don't have permission to conduct a check-in this volunteer!"
              );
              res.redirect(process.env.PUBLIC_ADDRESS + "/volunteers/manage");
            }
          } else {
            req.flash("error_msg", "Member is not a volunteer!");
            res.redirect(
              process.env.PUBLIC_ADDRESS +
                "/members/make-volunteer/" +
                member.member_id
            );
          }
        });
      }
    });
  }
);

router.post(
  "/:member_id",
  Auth.isLoggedIn,
  Auth.isOfClass(["admin", "staff", "volunteer"]),
  function(req, res) {
    Members.getById(req.params.member_id, req.user, function(err, member) {
      if (err || !member) {
        req.flash("error_msg", "Member not found!");
        res.redirect(process.env.PUBLIC_ADDRESS + "/volunteers/manage");
      } else {
        Volunteers.getVolunteerById(req.params.member_id, req.user, function(
          err,
          volInfo
        ) {
          if (volInfo) {
            if (
              Helpers.hasOneInCommon(volInfo.assignedCoordinators, [
                req.user.id
              ]) ||
              Helpers.hasOneInCommon(
                member.working_groups,
                req.user.working_groups_arr
              ) ||
              req.user.class == "admin"
            ) {
              var questionnaire = req.body.questionnaire;
              var questionnaireValid = true;
              async.eachOf(expectedQuestionnaire, function(question, question_id, callback){
                if(!questionnaire[question_id]){
                  questionnaireValid = false;
                }
                callback();
              }, function(){
                if(questionnaireValid){
                  VolunteerCheckIns.create(req.params.member_id, req.user.id, questionnaire, function(){
                    req.flash(
                      "success_msg",
                      "Questionnaire complete! Please update this volunteer's details to finish check-in"
                    );
                    res.redirect(process.env.PUBLIC_ADDRESS + "/volunteers/update/" + req.params.member_id);
                  })
                } else {
                  req.flash(
                    "error_msg",
                    "Please complete the questionnaire!"
                  );
                  res.redirect(process.env.PUBLIC_ADDRESS + "/volunteers/check-in/" + req.params.member_id);
                }
              })

            } else {
              req.flash(
                "error_msg",
                "You don't have permission to conduct a check-in this volunteer!"
              );
              res.redirect(process.env.PUBLIC_ADDRESS + "/volunteers/manage");
            }
          } else {
            req.flash("error_msg", "Member is not a volunteer!");
            res.redirect(
              process.env.PUBLIC_ADDRESS +
                "/members/make-volunteer/" +
                member.member_id
            );
          }
        });
      }
    });
  }
);

module.exports = router;