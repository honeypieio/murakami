/* jshint indent: 2 */

const Helpers = require(process.env.CWD + "/app/controllers/helper-functions/root");

module.exports = function (sequelize, DataTypes) {
  const AccessTokens = sequelize.define(
    "access_tokens",
    {
      token: {
        type: DataTypes.STRING(25),
        allowNull: false,
        primaryKey: true,
      },
      expirationTimestamp: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      details: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      used: {
        type: DataTypes.INTEGER(4),
        allowNull: false,
        defaultValue: "0",
      },
    },
    {
      tableName: "access_tokens",
      timestamps: false,
    }
  );
  Helpers.includeAllModelMethods(
    AccessTokens,
    sequelize,
    DataTypes,
    process.env.CWD + "/app/models/access_tokens/methods/"
  );
  return AccessTokens;
};
