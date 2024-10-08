module.exports = (StockCategories, sequelize, DataTypes) => {
  return async (list) => {
    const map = {};
    let node;
    const roots = [];

    for (let i = 0; i < list.length; i += 1) {
      list[i].absolute_name = list[i].name;
      map[list[i].item_id] = i; // init map
      list[i].children = []; // create children array
    }

    for (let i = 0; i < list.length; i += 1) {
      node = list[i];
      if (node.parent !== null) {
        try {
          node.absolute_name = list[map[node.parent]].name + " > " + node.absolute_name;

          if (list[map[node.parent]].parent) {
            node.absolute_name =
              list[map[list[map[node.parent]].parent]].name + " > " + node.absolute_name;
          }

          list[map[node.parent]].children.push(node);
        } catch (err) {}
      } else {
        roots.push(node);
      }
    }

    return roots;
  };
};
