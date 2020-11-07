const CronJob = require("cron").CronJob;
const moment = require("moment");
moment.locale("en-gb");

// Import models etc.
const rootDir = process.env.CWD;
const Models = require(rootDir + "/app/models/sequelize");
const Transactions = Models.Transactions;

const Helpers = require(rootDir + "/app/controllers/helper-functions/root");

const failedTransactions = new CronJob({
  // 2am everyday.
  cronTime: "0 0 2 * * *",
  onTick: async () => {
    let fxTransactions = {}; // SumUp transactions by ID.
    
    const transactions = await Transactions.getAllBetweenTwoDates(moment().subtract(1, "days").startOf("day"), moment().subtract(1, "days").endOf("day"));

    if(transactions.length == 0) {
      return;
    }

    const accessToken = await Helpers.SumUpAuth();

    if(!accessToken) {
      throw "Something went wrong contacting SumUp"; 
    }

    for await (const transaction of transactions) {

      if (!transaction.summary.paymentMethod != "card") {
        continue;
      }

      if(transaction.summary.sumupId) {
        continue;
      }

      const startTimestamp = moment(transaction.date).subtract(10, "minutes");
      const endTimestamp = moment(transaction.date).add(10, "minutes");

      const sumupTransactions = await Helpers.SumUpGetTransactionsBetweenTwoDates(startTimestamp, endTimestamp, accessToken);

      if(sumupTransactions.error_code) {
        continue;
      }

      for await (const fxTransaction of sumupTransactions.items) {
        if(fxTransaction.status != "SUCCESSFUL") {
          continue;
        }

        if(fxTransaction.amount != transaction.summary.totals.money) {
          continue;
        }

        if(fxTransactions[fxTransaction.transaction_code]) {
          continue;
        }

        const fxInUse = await Transactions.findOne({ where: { summary: { sumupId: fxTransaction.transaction_code } } });

        if(fxInUse) {
          continue;
        }


        let updatedSummary = transaction.summary;
        updatedSummary.sumupId = fxTransaction.transaction_code;
        await Transactions.update({ summary: updatedSummary }, { where: { transaction_id: transaction.transaction_id } });
        
        fxTransactions[fxTransaction.transaction_code] = true;
        await timeout(500);
      }
    }

  },
  start: false,
  timeZone: "Europe/London"
});

const timeout = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = failedTransactions;
