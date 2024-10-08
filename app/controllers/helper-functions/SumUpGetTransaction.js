const fetch = require("node-fetch");

module.exports = async (transaction_id, access_token) => {
  try {
    const response = await fetch(
      `https://api.sumup.com/v0.1/me/transactions?transaction_code=${transaction_id}`,
      {
        method: "get",
        headers: {
          authorization: `Bearer ${access_token}`,
        },
      }
    );
    const json = await response.json();

    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch transaction details: ${response.status} ${response.statusText}`
      );
    }

    return json;
  } catch (error) {
    throw "Something went wrong fetching the transaction details from SumUp";
  }
};
