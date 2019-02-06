// /api/get/notifications

var router = require("express").Router();
var async = require("async");
var moment = require("moment");

var rootDir = process.env.CWD;

var WorkingGroups = require(rootDir + "/app/models/working-groups");
var Notifications = require(rootDir + "/app/models/notifications");
var Volunteers = require(rootDir + "/app/models/volunteers");

var Auth = require(rootDir + "/app/configs/auth");

router.use("/read", require("./read"));

router.get("/", Auth.isLoggedIn, function(req, res) {
  var notifications = [];

  // Get unreviewed volunteer hours, volunteers who need to volunteer

  // Get unfinished volunteer roles

  // Get volunteer check-ins due

  try {
    var incompleteRolesOn =
      req.user.notification_preferences["unfinished-roles"]["murakami"];
  } catch (err) {
    var incompleteRolesOn = false;
  }

  try {
    var pendingHoursOn =
      req.user.notification_preferences["pending-volunteer-hours"]["murakami"];
  } catch (err) {
    var pendingHoursOn = false;
  }

  Notifications.getAllMessages(req.user.id, function(err, messages) {
    async.each(
      messages,
      function(message, callback) {
        notifications.push({
          message: message.body,
          action: "javascript::void(0);",
          icon: "fas fa-envelope",
          time: moment(message.timestamp).fromNow()
        });
        callback();
      },
      function() {
        if (["staff", "admin", "volunteer"].includes(req.user.class)) {
          WorkingGroups.getAllUnreviewedVolunteerHours(function(err, shifts) {
            var working_groups = req.user.working_groups_arr;
            var shiftsNeedAttention = [];

            async.each(
              shifts,
              function(shift, callback) {
                if (working_groups.includes(shift.working_group)) {
                  shiftsNeedAttention.push(shift);
                }
                callback();
              },
              function() {
                if (shiftsNeedAttention.length > 0 && pendingHoursOn) {
                  notifications.push({
                    message: "You have volunteer hours waiting to be reviewed",
                    action:
                      process.env.PUBLIC_ADDRESS + "/volunteers/review-hours",
                    icon: "fas fa-clock",
                    time: moment(
                      shiftsNeedAttention[shiftsNeedAttention.length - 1].date
                    ).fromNow()
                  });
                }
                var rolesNeedFinished = [];
                Volunteers.getAllRoles(function(err, roles) {
                  async.each(
                    roles,
                    function(role, callback) {
                      if (
                        Object.keys(role.details).length == 1 &&
                        working_groups.includes(role.group_id)
                      ) {
                        rolesNeedFinished.push(role);
                      }
                      callback();
                    },
                    function() {
                      if (rolesNeedFinished.length > 0 && incompleteRolesOn) {
                        console.log(
                          rolesNeedFinished[rolesNeedFinished.length - 1]
                        );
                        notifications.push({
                          message:
                            "You have volunteer roles that need to be completed",
                          action:
                            process.env.PUBLIC_ADDRESS +
                            "/volunteers/roles/manage",
                          icon: "fab fa-black-tie",
                          time:
                            moment(
                              rolesNeedFinished[rolesNeedFinished.length - 1]
                                .dateCreated
                            ).fromNow() || null
                        });
                      }
                      res.send(notifications);
                    }
                  );
                });
              }
            );
          });
        } else {
          res.send(notifications);
        }
      }
    );
  });
});

module.exports = router;
