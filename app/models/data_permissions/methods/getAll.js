module.exports = (DataPermissions, sequelize, DataTypes) => {
  return async () => {
    const formattedPermissions = {};
    const dataPermissions = await DataPermissions.findAll({ order: [["class", "ASC"]] });
    for await (const classPermission of dataPermissions) {
      formattedPermissions[classPermission.class] = classPermission.permissions;
    }
    return formattedPermissions;
  };
};
