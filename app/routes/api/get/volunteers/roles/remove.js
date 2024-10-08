// /api/get/volunteers/roles/remove

const router = require("express").Router();

const rootDir = process.env.CWD;

const Models = require(rootDir + "/app/models/sequelize");
const VolunteerRoles = Models.VolunteerRoles;

const Auth = require(rootDir + "/app/controllers/auth");

router.get(
  "/:role_id",
  Auth.isLoggedIn,
  Auth.canAccessPage("volunteerRoles", "update"),
  async (req, res) => {
    try {
      const role = await VolunteerRoles.getRoleById(req.params.role_id);
      if (!role) {
        throw "Role not found";
      }

      if (
        !(
          req.user.permissions.volunteerRoles.update == true ||
          (req.user.permissions.volunteerRoles.update == "commonWorkingGroup" &&
            req.user.working_groups.includes(role.group_id))
        )
      ) {
        throw "You don't have permission to deactivate this role";
      }

      if (role.removed == 1) {
        throw "Role is already deactivated";
      }

      await VolunteerRoles.removeRole(req.params.role_id);
      req.flash("success_msg", "Role deactivated.");
      res.redirect(process.env.PUBLIC_ADDRESS + "/volunteers/roles/view/" + req.params.role_id);
    } catch (error) {
      if (typeof error != "string") {
        error = "Something went wrong! Please try again";
      }

      req.flash("error_msg", error);
      res.redirect(process.env.PUBLIC_ADDRESS + "/volunteers/roles/view/" + req.params.role_id);
    }
  }
);

module.exports = router;
