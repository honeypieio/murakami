// /till/transaction

var router = require("express").Router();

var rootDir = process.env.CWD;

var Tills = require(rootDir + "/app/models/tills");
var Members = require(rootDir + "/app/models/members");
var Carbon = require(rootDir + "/app/models/carbon-calculations");

var Auth = require(rootDir + "/app/configs/auth");
var Helpers = require(rootDir + "/app/configs/helpful_functions");

router.post("/", Auth.isLoggedIn, function(req, res) {
  var till_id = req.body.till_id;
  var member_id = req.body.member_id;
  var paymentMethod = req.body.paymentMethod;
  var transaction = req.body.transaction;
  var payWithTokens = JSON.parse(req.body.payWithTokens) || false;
  var note = req.body.note;

  var membershipBought;

  Tills.getTillById(till_id, function(err, till) {
    if (till && !err) {
      Tills.getStatusById(till_id, function(status) {
        if (status.opening == 1) {
          Carbon.getCategories(function(err, carbonCategories) {
            Tills.getFlatCategoriesByTillId(till_id, function(err, categories) {
              var categoriesAsObj = {};
              var transactionSanitized = [];
              var carbonTransaction = {};

              var tokens_total = 0;
              var money_total = 0;
              var weight_total = 0;
              var member_discount_tokens = 0;
              var member_discount_money = 0;
              var discount_info = {};

              for (let i = 0; i < categories.length; i++) {
                let category = categories[i];
                categoriesAsObj[category.item_id] = category;
              }

              for (let i = 0; i < transaction.length; i++) {
                if (categoriesAsObj[transaction[i].id]) {
                  // Is valid category
                  let id = transaction[i].id;
                  if (categoriesAsObj[id].active == 1) {
                    let weight = transaction[i].weight;
                    let tokens = 0;
                    if (categoriesAsObj[id].value) {
                      tokens = categoriesAsObj[id].value;
                    } else {
                      tokens = transaction[i].tokens;
                    }

                    transaction[i] = categoriesAsObj[id];
                    transaction[i].weight = weight;
                    transaction[i].tokens = tokens;

                    if (categoriesAsObj[id].action) {
                      if (categoriesAsObj[id].action.substring(0, 3) == "MEM") {
                        membershipBought = categoriesAsObj[id].action;
                      }
                    }

                    if (categoriesAsObj[id].member_discount) {
                      discount_info[id] = categoriesAsObj[id].member_discount;
                    }

                    if (transaction[i].allowTokens == 1) {
                      tokens_total = +tokens_total + +transaction[i].tokens;
                      if (categoriesAsObj[id].member_discount) {
                        member_discount_tokens +=
                          (categoriesAsObj[id].member_discount / 100) *
                          transaction[i].tokens;
                      }
                    } else {
                      money_total = +money_total + +transaction[i].tokens;
                      if (categoriesAsObj[id].member_discount) {
                        member_discount_money +=
                          (categoriesAsObj[id].member_discount / 100) *
                          transaction[i].tokens;
                      }
                    }

                    if (
                      transaction[i].weight > 0 &&
                      carbonCategories[transaction[i].carbon_id]
                    ) {
                      if (carbonTransaction[transaction[i].carbon_id]) {
                        carbonTransaction[transaction[i].carbon_id] =
                          +carbonTransaction[transaction[i].carbon_id] +
                          +transaction[i].weight;
                      } else {
                        carbonTransaction[transaction[i].carbon_id] =
                          transaction[i].weight;
                      }
                      weight_total = +weight_total + +transaction[i].weight;
                    }

                    transaction[i] = {};
                    transaction[i].tokens = tokens;
                    transaction[i].item_id = id;

                    transactionSanitized.push(transaction[i]);
                  }
                }
              }

              transaction = transactionSanitized;

              var formattedTransaction = {
                till_id: till_id,
                user_id: req.user.id,
                member_id: member_id || "anon",
                date: new Date(),
                summary: {
                  totals: {},
                  bill: transaction,
                  comment: note
                }
              };

              if (member_id) {
                // TODO: Update balance.
                Members.getById(member_id, { class: "admin" }, function(
                  err,
                  member
                ) {
                  if (member && !err) {
                    if (member.is_member == 1 || membershipBought) {
                      let totals = {};

                      money_total = money_total - member_discount_money;
                      tokens_total = tokens_total - member_discount_tokens;

                      formattedTransaction.summary.discount_info = discount_info;

                      if (payWithTokens == true) {
                        if (money_total == 0) {
                          if (member.balance >= tokens_total) {
                            totals.tokens = Math.ceil(tokens_total);
                          } else {
                            let difference = tokens_total - member.balance;
                            totals.money = difference.toFixed(2);
                            totals.tokens = tokens_total - difference;
                          }
                        } else {
                          var money = 0;
                          var tokens = 0;

                          if (member.balance - tokens_total >= 0) {
                            tokens = tokens_total;
                            money = money_total;
                          } else {
                            tokens = member.balance;
                            money =
                              +money_total +
                              Math.abs(member.balance - tokens_total);
                          }

                          totals.money = money.toFixed(2);
                          totals.tokens = Math.ceil(tokens);
                        }
                      } else {
                        totals.money = (+tokens_total + +money_total).toFixed(
                          2
                        );
                      }

                      if (totals.money == 0 && totals.tokens == 0) {
                        transaction.summary.paymentMethod = null;
                      }

                      formattedTransaction.summary.totals = totals;

                      let response = {
                        status: "ok",
                        msg: "Transaction complete!"
                      };

                      if (formattedTransaction.summary.totals.money > 0) {
                        formattedTransaction.summary.paymentMethod = paymentMethod;
                        response.msg +=
                          " £" + formattedTransaction.summary.totals.money;
                        if (formattedTransaction.summary.totals.tokens > 0) {
                          response.msg += " and";
                        }
                      }

                      if (formattedTransaction.summary.totals.tokens > 0) {
                        response.msg +=
                          " " +
                          formattedTransaction.summary.totals.tokens +
                          " tokens";
                      }

                      if (
                        !formattedTransaction.summary.totals.tokens &&
                        !formattedTransaction.summary.totals.money
                      ) {
                        response.msg += " Nothing";
                      }

                      response.msg += " paid.";

                      let returnedMember = {};

                      var isMember = false;

                      if (member.is_member == 1) {
                        isMember = true;
                      }

                      returnedMember.id = member.member_id;
                      returnedMember.name =
                        member.first_name + " " + member.last_name;
                      returnedMember.balance = member.balance;
                      returnedMember.is_member = isMember;
                      returnedMember.membership_expires =
                        member.current_exp_membership;

                      if (membershipBought == "MEM-FY") {
                        Members.renew(member_id, "full_year", function() {});
                        response.msg += " Membership renewed for 12 years.";
                        returnedMember.is_member = true;
                        var dt = new Date();
                        returnedMember.membership_expires = new Date(
                          dt.setMonth(dt.getMonth() + 12)
                        );
                      } else if (membershipBought == "MEM-HY") {
                        Members.renew(member_id, "half_year", function() {});
                        response.msg += " Membership renewed for 6 months.";
                        returnedMember.is_member = true;
                        var dt = new Date();
                        returnedMember.membership_expires = new Date(
                          dt.setMonth(dt.getMonth() + 6)
                        );
                      } else if (membershipBought == "MEM-QY") {
                        Members.renew(member_id, "3_months", function() {});
                        response.msg += " Membership renewed for 3 months.";
                        returnedMember.is_member = true;
                        var dt = new Date();
                        returnedMember.membership_expires = new Date(
                          dt.setMonth(dt.getMonth() + 3)
                        );
                      }

                      if (formattedTransaction.summary.totals.tokens > 0) {
                        returnedMember.balance =
                          member.balance -
                          formattedTransaction.summary.totals.tokens;
                      } else {
                        returnedMember.balance = member.balance;
                      }

                      response.member = returnedMember;
                      formattedTransaction.summary.totals.money =
                        formattedTransaction.summary.totals.money || 0;
                      if (
                        formattedTransaction.summary.totals.money == 0 ||
                        (formattedTransaction.summary.totals.money > 0 &&
                          (formattedTransaction.summary.paymentMethod ==
                            "cash" ||
                            formattedTransaction.summary.paymentMethod ==
                              "card"))
                      ) {
                        formattedTransaction.summary = JSON.stringify(
                          formattedTransaction.summary
                        );

                        Tills.addTransaction(formattedTransaction, function(
                          err,
                          transaction_id
                        ) {
                          if (err) {
                            res.send({
                              status: "fail",
                              msg: "Something has gone terribly wrong!"
                            });
                          } else {
                            
                            var carbon = {
                              member_id: member_id,
                              user_id: req.user.id,
                              trans_object: JSON.stringify(carbonTransaction),
                              amount: weight_total,
                              group_id: till.group_id,
                              method: "recycled"
                            };
                            Carbon.add(carbon, function(err) {
                              Helpers.calculateCarbon(
                                [carbon],
                                carbonCategories,
                                function(carbonSaved) {
                                  if (carbonSaved > 0) {
                                    response.msg +=
                                      " " +
                                      Math.abs(carbonSaved.toFixed(2)) +
                                      "kg of carbon saved!";
                                  }
                                  Members.updateBalance(
                                    member_id,
                                    returnedMember.balance,
                                    function(err) {
                                      if (paymentMethod == "card") {
                                        var sumupSummon =
                                          "sumupmerchant://pay/1.0?affiliate-key=" +
                                          process.env.SUMUP_AFFILIATE_KEY +
                                          "&app-id=" +
                                          process.env.SUMUP_APP_ID +
                                          "&title=" +
                                          req.user.allWorkingGroupsObj[
                                            till.group_id
                                          ].name +
                                          " purchase" +
                                          "&total=" +
                                          totals.money +
                                          "&currency=GBP" +
                                          "&foreign-tx-id=" +
                                          transaction_id +
                                          "&callback=" +
                                          encodeURIComponent(
                                            process.env.PUBLIC_ADDRESS +
                                              "/api/get/tills/smp-callback" +
                                              "/?murakamiStatus=" +
                                              response.status +
                                              "&murakamiMsg=" +
                                              response.msg +
                                              "&till_id=" +
                                              till.till_id
                                          );

                                        if (member) {
                                          if (member.email) {
                                            sumupSummon +=
                                              "&receipt-email=" + member.email;
                                          }
                                          if (member.phone_no) {
                                            sumupSummon +=
                                              "&receipt-mobilephone=" +
                                              member.phone_no;
                                          }
                                        }

                                        
                                        if (response.status == "ok") {
                                          res.send({
                                            status: "redirect",
                                            url: sumupSummon
                                          });
                                        } else {
                                          res.send(response);
                                        }
                                      } else {
                                        res.send(response);
                                      }
                                    }
                                  );
                                }
                              );
                            });
                          }
                        });
                      } else {
                        res.send({
                          status: "fail",
                          msg: "Please select a valid payment method."
                        });
                      }
                    } else {
                      res.send({
                        status: "fail",
                        msg: "Membership expired! Please renew."
                      });
                    }
                  } else {
                    res.send({
                      status: "fail",
                      msg: "Couldn't find that member!"
                    });
                  }
                });
              } else {
                // Process anonymous transaction.
                let totals = {};
                totals.money = (tokens_total + money_total).toFixed(2);
                formattedTransaction.summary.totals = totals;

                if (paymentMethod == "cash" || paymentMethod == "card") {
                  formattedTransaction.summary.paymentMethod = paymentMethod;

                  let response = {
                    status: "ok",
                    msg: "Transaction complete! £" + totals.money + " paid."
                  };

                  if (membershipBought) {
                    if (membershipBought == "MEM-FY") {
                      response.status = "ok";
                      response.msg +=
                        " Full year of membership purchased - <a href='/members/add?membership_length=year&till_id=" +
                        till_id +
                        "' target='_blank'>add new member</a>";
                    } else if (membershipBought == "MEM-HY") {
                      response.status = "ok";
                      response.msg +=
                        " Half a year of membership purchased - <a href='/members/add?membership_length=half_year&till_id=" +
                        till_id +
                        "' target='_blank'>add new member</a>";
                    } else if (membershipBought == "MEM-QY") {
                      response.status = "ok";
                      response.msg +=
                        " 3 months a year of membership purchased - <a href='/members/add?membership_length=3_months&till_id=" +
                        till_id +
                        "' target='_blank'>add new member</a>";
                    }
                  }

                  formattedTransaction.summary = JSON.stringify(
                    formattedTransaction.summary
                  );

                  Tills.addTransaction(formattedTransaction, function(
                    err,
                    transaction_id
                  ) {
                    if (err) {
                      res.send({
                        status: "fail",
                        msg: "Something has gone terribly wrong!"
                      });
                    } else {
                      var carbon = {
                        member_id: "anon",
                        user_id: req.user.id,
                        trans_object: JSON.stringify(carbonTransaction),
                        amount: weight_total,
                        group_id: till.group_id,
                        method: "recycled"
                      };
                      Carbon.add(carbon, function(err) {
                        Helpers.calculateCarbon(
                          [carbon],
                          carbonCategories,
                          function(carbonSaved) {
                            if (carbonSaved > 0) {
                              response.msg +=
                                " " +
                                Math.abs(carbonSaved.toFixed(2)) +
                                "kg of carbon saved!";
                            }
                            if (paymentMethod == "card") {
                              var sumupSummon =
                                "sumupmerchant://pay/1.0?affiliate-key=" +
                                process.env.SUMUP_AFFILIATE_KEY +
                                "&app-id=" +
                                process.env.SUMUP_APP_ID +
                                "&title=" +
                                req.user.allWorkingGroupsObj[till.group_id]
                                  .name +
                                "&total=" +
                                totals.money +
                                "&currency=GBP" +
                                "&foreign-tx-id=" +
                                transaction_id +
                                "&callback=" +
                                encodeURIComponent(
                                  process.env.PUBLIC_ADDRESS +
                                    "/api/get/tills/smp-callback" +
                                    "/?murakamiStatus=" +
                                    response.status +
                                    "&murakamiMsg=" +
                                    response.msg +
                                    "&till_id=" +
                                    till.till_id
                                );

                              
                              if (response.status == "ok") {
                                res.send({
                                  status: "redirect",
                                  url: sumupSummon
                                });
                              } else {
                                res.send(response);
                              }
                            } else {
                              res.send(response);
                            }
                          }
                        );
                      });
                    }
                  });
                } else {
                  res.send({
                    status: "fail",
                    msg: "Please select a valid payment method."
                  });
                }
              }
            });
          });
        } else {
          res.send({ status: "fail", msg: "Till is not open." });
        }
      });
    } else {
      res.send({ status: "fail", msg: "Till does not exist." });
    }
  });
});

module.exports = router;