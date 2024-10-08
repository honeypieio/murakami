// /api/post/tills/reports/transactions-by-project

const router = require("express").Router();

const moment = require("moment");
moment.locale("en-gb");

const rootDir = process.env.CWD;

const Models = require(rootDir + "/app/models/sequelize");
const Tills = Models.Tills;
const Transactions = Models.Transactions;
const Members = Models.Members;
const StockCategories = Models.StockCategories;

const Auth = require(rootDir + "/app/controllers/auth");
const Helpers = require(rootDir + "/app/controllers/helper-functions/root");

router.post("/", Auth.verifyByKey("tillRevenue"), async (req, res) => {
  try {
    const till_id = req.body.till_id;
    const startDateRaw = req.body.startDate;
    const endDateRaw = req.body.endDate;

    if (!till_id) {
      throw "No till specified";
    }

    const till = await Tills.getById(till_id);

    if (!till) {
      throw "Till not found";
    }

    const formattedStartDate = moment(startDateRaw).startOf("month").toDate();
    const formattedEndDate = moment(endDateRaw).endOf("month").toDate();

    const transactions = await Transactions.getAllBetweenTwoDatesByTillId(
      till_id,
      formattedStartDate,
      formattedEndDate
    );
    const { membersObj } = await Members.getAll();
    const categories = await StockCategories.getCategories("treeKv");
    const formattedTransactions = await Transactions.formatTransactions(
      transactions,
      membersObj,
      categories,
      till_id
    );

    const sanitizedFormattedTransactions = [];

    for await (const transaction of formattedTransactions) {
      if (!transaction.paymentFailed && !transaction.isRefund) {
        sanitizedFormattedTransactions.push(transaction);
      }

      if (transaction.isYoyoCupReturn) {
        transaction.totals.moneyPlain = Number(-transaction.totals.moneyPlain).toFixed(2);
        transaction.totals.cash = Number(-transaction.totals.cash).toFixed(2);
        transaction.totals.card = Number(-transaction.totals.card).toFixed(2);
      }
    }
    console.log(formattedTransactions[0]);
    res.send(sanitizedFormattedTransactions);
  } catch (error) {
    console.log(error);
    res.send([]);
  }
});
module.exports = router;
