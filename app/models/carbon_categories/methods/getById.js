module.exports = function(CarbonCategories, sequelize, DataTypes) {
  return (CarbonCategories.getById = function(carbon_id, callback) {
    CarbonCategories.findOne({ where: { carbon_id: carbon_id } }).nodeify(
      function(err, category) {
        if (category[0]) {
          category = category[0];
          category.factors = JSON.parse(category.factors);
          callback(err, category);
        } else {
          callback("No category", null);
        }
      }
    );
  });
};
