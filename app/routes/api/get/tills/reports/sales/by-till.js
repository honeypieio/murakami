// /api/get/tills/reports/sales/by-till

var router = require("express").Router();
var async = require("async");
var moment = require("moment");
moment.locale("en-gb");

var rootDir = process.env.CWD;

var Tills = require(rootDir + "/app/models/tills");

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

router.get("/:till_id", Auth.verifyByKey, function(req, res) {
  var startDate;
  var endDate;
  var condition = req.query.condition || null;
  var item_id = req.query.item_id || null;
  try {
    startDate =
      moment(req.query.startDate).format("YYYY-MM-DD") ||
      moment().format("YYYY-MM-DD");
  } catch (err) {
    startDate = moment().format("YYYY-MM-DD");
  }

  try {
    endDate =
      moment(req.query.endDate).format("YYYY-MM-DD") ||
      moment().format("YYYY-MM-DD");
  } catch (err) {
    endDate = moment().format("YYYY-MM-DD");
  }

  var revenue = {
    total: 0,
    breakdown: {
      cash: 0,
      card: 0
    }
  };

  Tills.getTillById(req.params.till_id, function(err, till) {
    if (till) {
      Tills.getAllTransactionsBetweenDatesByTillId(
        till.till_id,
        startDate,
        endDate,
        function(err, transactions) {
          async.each(
            transactions,
            function(transaction, callback) {
              transaction.summary = JSON.parse(transaction.summary);

              if (
                !isNaN(transaction.summary.totals.money) &&
                transaction.summary.totals.money > 0
              ) {
                if (condition == null && item_id == null) {
                  revenue.total += +transaction.summary.totals.money;

                  if (transaction.summary.paymentMethod == "cash") {
                    revenue.breakdown.cash += +transaction.summary.totals.money;
                  } else if (transaction.summary.paymentMethod == "card") {
                    revenue.breakdown.card += +transaction.summary.totals.money;
                  }
                } else {
                  async.each(
                    transaction.summary.bill,
                    function(item, callback) {
                      if (condition != null && item_id != null) {
                        if (item.condition) {
                          if (
                            item.condition.toLowerCase() ==
                              condition.toLowerCase() &&
                            item.item_id == item_id
                          ) {
                            revenue.total += +item.tokens;

                            if (transaction.summary.paymentMethod == "cash") {
                              revenue.breakdown.cash += +item.tokens;
                            } else if (
                              transaction.summary.paymentMethod == "card"
                            ) {
                              revenue.breakdown.card += +item.tokens;
                            }
                          }
                        }
                      } else if (condition != null && item_id == null) {
                        if (item.condition) {
                          if (
                            item.condition.toLowerCase() ==
                            condition.toLowerCase()
                          ) {
                            revenue.total += +item.tokens;

                            if (transaction.summary.paymentMethod == "cash") {
                              revenue.breakdown.cash += +item.tokens;
                            } else if (
                              transaction.summary.paymentMethod == "card"
                            ) {
                              revenue.breakdown.card += +item.tokens;
                            }
                          }
                        }
                      } else if (item_id != null && condition == null) {
                        if (item.item_id == item_id) {
                          revenue.total += +item.tokens;

                          if (transaction.summary.paymentMethod == "cash") {
                            revenue.breakdown.cash += +item.tokens;
                          } else if (
                            transaction.summary.paymentMethod == "card"
                          ) {
                            revenue.breakdown.card += +item.tokens;
                          }
                        }
                      }
                    },
                    function() {}
                  );
                }
              }

              callback();
            },
            function() {
              revenue.total = revenue.total.toFixed(2);
              revenue.breakdown.cash = revenue.breakdown.cash.toFixed(2);
              revenue.breakdown.card = revenue.breakdown.card.toFixed(2);
              res.send(revenue);
            }
          );
        }
      );
    } else {
      res.send(revenue);
    }
  });
});

module.exports = router;
