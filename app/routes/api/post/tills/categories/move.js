// /api/post/tills/categories/move

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
      const newParent = req.body.newParent;

      if (!till_id) {
        throw "Please specify a till";
      }

      if (item_id === "membership") {
        throw "You cannot move the category 'Membership'";
      }

      if (!item_id) {
        throw "Please specify a category to move";
      }

      if (!newParent) {
        throw "Please specify a category to move to";
      }

      if (newParent == item_id) {
        throw "Category can't be it's on parent";
      }

      const till = await Tills.getById(till_id);

      if (!till) {
        throw "Till not found";
      }

      if (till.disabled == 1) {
        throw "Till is disabled";
      }

      if (
        !(
          req.user.permissions.tills.updateCategories == true ||
          (req.user.permissions.tills.updateCategories == "commonWorkingGroup" &&
            req.user.working_groups.includes(till.group_id))
        )
      ) {
        throw "You don't have permission to move categories on this till";
      }

      const categories = await StockCategories.getCategoriesByTillId(till_id, "kv");

      if (!categories[item_id]) {
        throw "Please specify a valid category to move";
      }

      if (!categories[newParent]) {
        throw "Please specify a valid category to move to";
      }

      await StockCategories.moveCategory(item_id, newParent);
      let successMessage = "Category moved!";
      if (categories[item_id].discount) {
        successMessage = "Discount moved!";
      }

      res.send({ status: "ok", msg: successMessage });
    } catch (error) {
      if (typeof error != "string") {
        error = "Something went wrong! Please try again";
      }

      res.send({ status: "fail", msg: error });
    }
  }
);

module.exports = router;
