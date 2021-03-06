const moment = require("moment");
moment.locale("en-gb");

module.exports = async (period, startDate, endDate) => {
  let formattedStartDate, formattedEndDate;

  try {
    if (period == "custom") {
      if (startDate && endDate) {
        formattedStartDate = moment(startDate).startOf("day").toDate();
        formattedEndDate = moment(endDate).endOf("day").toDate();
      } else {
        throw Error;
      }
    } else {
      formattedEndDate = moment().endOf("day").toDate();

      if (period == "all-time") {
        formattedStartDate = moment("1970-01-01").toDate();
      } else if (period == "year") {
        formattedStartDate = moment().startOf("year").toDate();
      } else if (period == "month") {
        formattedStartDate = moment().startOf("month").toDate();
      } else if (period == "week") {
        formattedStartDate = moment().startOf("week").toDate();
      } else {
        formattedStartDate = moment().startOf("day").toDate();
      }
    }
  } catch (error) {
    formattedStartDate = moment().startOf("day").toDate();
    formattedEndDate = moment().endOf("day").toDate();
  }

  return { formattedStartDate, formattedEndDate };
};
