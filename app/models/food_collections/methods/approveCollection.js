module.exports = function (FoodCollections, sequelize, DataTypes) {
  return function (transaction_id, callback) {
    FoodCollections.update({ approved: 1 }, { where: { transaction_id: transaction_id } }).nodeify(
      function (err) {
        callback(err);
      }
    );
  };
};
