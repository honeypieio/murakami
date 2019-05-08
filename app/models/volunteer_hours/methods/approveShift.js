module.exports = function(VolunteerHours, sequelize, DataTypes) {
  return function(shift_id, callback) {
    VolunteerHours.update(
      { approved: 1 },
      { where: { shift_id: shift_id } }
    ).nodeify(callback);
  };
};
