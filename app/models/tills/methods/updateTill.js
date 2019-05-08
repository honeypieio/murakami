module.exports = function(Tills, sequelize, DataTypes) {
  return function(till, callback) {
    var query = "UPDATE tills SET name = ?, stockControl = ? WHERE till_id = ?";
    var inserts = [till.name, 0, till.till_id];
    Tills.update(
      { name: till.name, stockControl: 0 },
      { where: { till_id: till.till_id } }
    ).nodeify(function(err) {
      callback(err);
    });
  };
};
