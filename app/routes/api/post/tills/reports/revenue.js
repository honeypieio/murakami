// /api/post/tills/reports/revenue

const router = require("express").Router();

const lodash = require("lodash");
const moment = require("moment");
moment.locale("en-gb");

const rootDir = process.env.CWD;
const Models = require(rootDir + "/app/models/sequelize");
const Tills = Models.Tills;
const Transactions = Models.Transactions;
const StockCategories = Models.StockCategories;
const WorkingGroups = Models.WorkingGroups;

const Auth = require(rootDir + "/app/controllers/auth");

router.post("/", Auth.verifyByKey("tillRevenue"), async (req, res) => {
  try {
    const { allWorkingGroupsObj } = await WorkingGroups.getAll();
    
    let response = {
      status: "fail",
      msg: "Something went wrong!",
      summary: {},
      workingGroups: allWorkingGroupsObj
    };

    let blankSummary = {
      total: 0,
      totalSales: 0,
      memberTotalSales: 0,
      breakdown: {
        card: 0,
        cash: 0
      }
    };

    const { tillsObj } = await Tills.getAll();
    const categories = await StockCategories.getAllCategories();
    const transactions = await Transactions.getAll();
    
    for await (const transaction of transactions) {
      if(!transaction.till_id) {
        continue;
      }

      if(!tillsObj[transaction.till_id]) {
        continue;
      }

      if(!transaction.summary) {
        continue;
      }

      if(!["cash", "card"].includes(transaction.summary.paymentMethod)) {
        continue;
      }

      if(transaction.summary.paymentMethod == "card" && !transaction.summary.sumupId) {
        continue;
      }
      
      if (transaction.summary.totals.money == 0) {
        continue;
      }
      
      if (!transaction.summary.bill[0]) {
        continue;
      }
      
      if (!transaction.summary.bill[0].item_id) {
        continue;
      }
      
      if (["membership", "donation", "volunteering", "refund"].includes(transaction.summary.bill[0].item_id)) {
        continue;
      }

      let monthKey = moment(transaction.date).startOf("month").format("YYYY-MM-DD");

      if (response.summary[monthKey] === undefined) {
        response.summary[monthKey] = {};
        response.summary[monthKey].revenue = lodash.cloneDeep(blankSummary);
        response.summary[monthKey].byGroup = {};
      }

      let moneyBudget = transaction.summary.totals.money;

      for await (const item of transaction.summary.bill) {
        if(!categories[item.item_id]) {
          continue;
        }

        let group_id;
        
        if (allWorkingGroupsObj[categories[item.item_id].group_id]) {
          group_id = categories[item.item_id].group_id;
        } else if (allWorkingGroupsObj[tillsObj[transaction.till_id].group_id]) {
          group_id = tillsObj[transaction.till_id].group_id;
        } else {
          group_id = null;
        }
        
        if (group_id !== null) {
          if (!response.summary[monthKey].byGroup[group_id]) {
            response.summary[monthKey].byGroup[group_id] = lodash.cloneDeep(blankSummary);
          }

          let itemValue = parseFloat((parseFloat(item.value) || parseFloat(item.tokens)) * (parseInt(item.quantity) || 1)) || 0;
          if (transaction.summary.totals.money > 0 && transaction.summary.totals.tokens > 0) {
            if (itemValue > moneyBudget) {
              itemValue = itemValue - Math.abs(moneyBudget - itemValue);
              moneyBudget = 0;
            } else {
              moneyBudget = moneyBudget - itemValue;
            }
          }

          response.summary[monthKey].revenue.total += Number(itemValue);
          
          if (response.summary[monthKey].revenue.breakdown[transaction.summary.paymentMethod] !== undefined) {
            response.summary[monthKey].revenue.breakdown[transaction.summary.paymentMethod] += Number(itemValue);
          }

          response.summary[monthKey].byGroup[group_id].total += Number(itemValue);
					response.summary[monthKey].byGroup[group_id].totalSales += +1;

					if(transaction.member_id != "anon") {
						response.summary[monthKey].byGroup[group_id].memberTotalSales += +1;
					}

          if (response.summary[monthKey].byGroup[group_id].breakdown[transaction.summary.paymentMethod] !== undefined) {
            response.summary[monthKey].byGroup[group_id].breakdown[transaction.summary.paymentMethod] += Number(itemValue);
          }
        }
      }
    }
    
    let month = moment("2018-11-01");
    const monthDifference = Math.floor(moment().diff(moment(month), "months"));

    for (let i = 0; i < monthDifference; i++) {
      const monthKey = moment(moment(month).add(1, "months")).startOf("month").format("YYYY-MM-DD");

      if (response.summary[monthKey] === undefined) {
        response.summary[monthKey] = {};
        response.summary[monthKey].revenue = lodash.cloneDeep(blankSummary);
        response.summary[monthKey].byGroup = {};
      }
    }

    let sortedSummary = {}
    
    Object.keys(response.summary).sort().forEach((key) => { sortedSummary[key] = response.summary[key] });
    res.send({ status: "ok", summary: sortedSummary, workingGroups: allWorkingGroupsObj });
  } catch (error) {
    console.log(error);
    res.send({ status: "fail", summary: {} });
  }
});

module.exports = router;
