// /settings/email-templates

var router = require("express").Router();

var rootDir = process.env.CWD;

var Settings = require(rootDir + "/app/models/settings");

var Auth = require(rootDir + "/app/configs/auth");

router.get("/", Auth.isLoggedIn, Auth.isOfClass(["admin"]), function(req, res) {
  Settings.getEmailTemplates(function(err, templates) {
    if (err) throw err;
    res.redirect("/settings/email-templates/" + templates[0].mail_id);
  });
});

router.get("/:mail_id", Auth.isLoggedIn, Auth.isOfClass(["admin"]), function(
  req,
  res
) {
  Settings.getEmailTemplates(function(err, templates) {
    if (err) throw err;
    Settings.getEmailTemplateById(req.params.mail_id, function(err, template) {
      if (err || !template[0]) {
        res.redirect("/settings/email-templates/");
      } else {
        res.render("settings/email-templates", {
          title: "Email Templates",
          settingsActive: true,
          templates: templates,
          template: template[0]
        });
      }
    });
  });
});

router.post("/:mail_id", Auth.isLoggedIn, Auth.isOfClass(["admin"]), function(
  req,
  res
) {
  Settings.getEmailTemplateById(req.params.mail_id, function(err, template) {
    if (err || !template[0]) {
      res.send("Couldn't find that template!");
    }

    var subject = req.body.subject;
    var markup = req.body.markup;
    var active = req.body.templateActive;

    if (active == "on") {
      active = 1;
    } else {
      active = 0;
    }

    var template = {
      id: req.params.mail_id,
      subject: subject,
      markup: markup,
      active: active
    };

    Settings.updateEmailTemplate(template, function(err) {
      if (err) {
        res.render("settings/email-templates", {
          title: "Email Templates",
          emailTemplatesActive: true,
          template: {
            mail_id: req.params.mail_id,
            subject: subject,
            markup: markup,
            active: active
          }
        });
      } else {
        req.flash("success_msg", "Template successfully updated!");
        res.redirect(
          process.env.PUBLIC_ADDRESS +
            "/settings/email-templates/" +
            req.params.mail_id
        );
      }
    });
  });
});

module.exports = router;
