// Custom handlebar helpers

const moment = require("moment");
moment.locale("en-gb");
const lodash = require("lodash");

const register = function (Handlebars) {
  const helpers = {
    select: function (value, options) {
      return options
        .fn(this)
        .split("\n")
        .map(function (v) {
          const t = 'value="' + value + '"';
          return !RegExp(t).test(v) ? v : v.replace(t, t + " selected");
        })
        .join("\n");
    },
    ifEqual: function (conditional, options) {
      if (options.hash.value === conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },
    ifGreaterThan: function (v1, v2, options) {
      if (v1 > v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    },

    ifNotEmpty: function (object, values, options) {
      values = JSON.parse(values);
      const validOptions = [true, "commonWorkingGroup"];
      let found = false;
      if (object) {
        for (let i = 0; i < values.length; i++) {
          if (validOptions.includes(object[values[i]])) {
            found = true;
          }
        }
      }
      if (found) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },

    ifUserClass: function (userClass, classes, options) {
      classes = JSON.parse(classes);
      if (classes.includes(userClass)) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },
    ifArrayIncludes: function (string, array, options) {
      if (array.includes(string)) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    },
    groupedEach: function (every, context, options) {
      let out = "",
        subcontext = [];

      if (!Array.isArray(context)) {
        context = Object.keys(context).map(function (key) {
          const obj = {};
          obj[key] = context[key];
          return obj;
        });
      }

      if (context.length > 0) {
        for (let i = 0; i < context.length; i++) {
          if (i > 0 && i % every === 0) {
            out += options.fn(subcontext);
            subcontext = [];
          }
          subcontext.push(context[i]);
        }
        out += options.fn(subcontext);
      }
      return out;
    },
    json: function (context) {
      return JSON.stringify(context);
    },

    ifCond: function (v1, operator, v2, options) {
      switch (operator) {
        case "==":
          return v1 == v2 ? options.fn(this) : options.inverse(this);
        case "===":
          return v1 === v2 ? options.fn(this) : options.inverse(this);
        case "!=":
          return v1 != v2 ? options.fn(this) : options.inverse(this);
        case "!==":
          return v1 !== v2 ? options.fn(this) : options.inverse(this);
        case "<":
          return v1 < v2 ? options.fn(this) : options.inverse(this);
        case "<=":
          return v1 <= v2 ? options.fn(this) : options.inverse(this);
        case ">":
          return v1 > v2 ? options.fn(this) : options.inverse(this);
        case ">=":
          return v1 >= v2 ? options.fn(this) : options.inverse(this);
        case "&&":
          return v1 && v2 ? options.fn(this) : options.inverse(this);
        case "||":
          return v1 || v2 ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    },

    formToPlain: function (str) {
      if (str) {
        return str.replace(/[-_]/g, " ").replace(/\w\S*/g, function (txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
      } else {
        return "";
      }
    },
    slugify: function (str) {
      return str
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    },
    lookupArray: function (array, value) {
      if (Array.isArray(array)) {
        if (array.indexOf(value) != -1) {
          return true;
        } else {
          return false;
        }
      } else {
        return;
      }
    },
    not: function (value) {
      if (value) {
        return false;
      } else {
        return true;
      }
    },
    setVariable: function (varName, varValue, options) {
      options.data.root[varName] = varValue;
    },
    setVariableProperty: function (varName, varProperty, varValue, options) {
      options.data.root[varName][varProperty] = varValue;
    },
    niceDate: function (date) {
      if (date) {
        return moment(date).format("L");
      } else {
        return "Never";
      }
    },
    niceTimestamp: function (date) {
      if (date) {
        return moment(date).format("L hh:mm A");
      } else {
        return "Never";
      }
    },
    lengthOf: function (data) {
      if (Array.isArray(data)) {
        return data.length;
      } else if (typeof data === "object" && data !== null) {
        return Object.keys(data).length;
      } else {
        return 0;
      }
    },
    concat: function (str1, str2) {
      return str1 + str2;
    },
    uriencode: function (str) {
      return encodeURIComponent(str);
    },
    camelCaseToPlain: function (str) {
      return lodash.startCase(str);
    },
    escape: function (variable) {
      try {
        return variable.replace(/(['"])/g, "\\$1");
      } catch (err) {
        return "";
      }
    },
    round2DP: function (number) {
      try {
        return Number(number).toFixed(2);
      } catch (err) {
        if (err) console.log(err);
        return "0.00";
      }
    },
    multiply: function (num1, num2) {
      return num1 * num2;
    },
  };

  if (Handlebars && typeof Handlebars.registerHelper === "function") {
    for (const prop in helpers) {
      Handlebars.registerHelper(prop, helpers[prop]);
    }
  } else {
    return helpers;
  }
};

module.exports.register = register;
module.exports.helpers = register(null);
