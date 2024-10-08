/* jshint indent: 2 */

const Helpers = require(process.env.CWD + "/app/controllers/helper-functions/root");

module.exports = function (sequelize, DataTypes) {
  const VolunteerHours = sequelize.define(
    "volunteer_hours",
    {
      shift_id: {
        type: DataTypes.STRING(11),
        allowNull: false,
        primaryKey: true,
      },
      member_id: {
        type: DataTypes.STRING(11),
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      duration_as_decimal: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      working_group: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      approved: {
        type: DataTypes.INTEGER(1),
        allowNull: true,
      },
    },
    {
      tableName: "volunteer_hours",
      timestamps: false,
    }
  );

  Helpers.includeAllModelMethods(
    VolunteerHours,
    sequelize,
    DataTypes,
    process.env.CWD + "/app/models/volunteer_hours/methods/"
  );

  return VolunteerHours;
};
