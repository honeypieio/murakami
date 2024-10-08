// /api/post/tills/categories/remove

const router = require("express").Router();

const rootDir = process.env.CWD;

const Models = require(rootDir + "/app/models/sequelize");
const Tills = Models.Tills;
const StockCategories = Models.StockCategories;

const Auth = require(rootDir + "/app/controllers/auth");

router.post(
  "/",
  Auth.isLoggedIn,
  Auth.canAccessPage("tills", "updateCategories"),
  async (req, res) => {
    try {
      const till_id = req.body.till_id;
      const item_id = req.body.item_id;

      if (!till_id) {
        throw "No till specified";
      }

      const till = await Tills.getById(till_id);

      if (!till) {
        throw "Till not found";
      }

      if (till.disabled == 1) {
        throw "Till is disabled!";
      }

      if (
        !(
          req.user.permissions.tills.updateCategories == true ||
          (req.user.permissions.tills.updateCategories == "commonWorkingGroup" &&
            req.user.working_groups.includes(till.group_id))
        )
      ) {
        throw "You don't have permission to update categories on this till";
      }

      if (item_id === "membership") {
        throw "You cannot remove the category 'Membership'";
      }

      if (!item_id) {
        throw "No item specified";
      }

      const categories = await StockCategories.getCategoriesByTillId(till_id, "kv");

      if (!categories[item_id]) {
        throw "Category not found";
      }

      await StockCategories.removeCategory(item_id);

      res.send({ status: "ok", msg: "Category removed!" });
    } catch (error) {
      if (typeof error != "string") {
        error = "Something went wrong! Please try again";
      }

      res.send({ status: "fail", msg: error });
    }
  }
);

module.exports = router;
