require("dotenv").config();
var assert = require("chai").assert;
var getCommonItemsInArray = require(process.env.CWD +
  "/app/helper-functions/getCommonItemsInArray");

describe("Helpers.getCommonItemsInArray", function() {
  it("should return an array", function() {
    var result = getCommonItemsInArray([1, 2, 3], [1, 2, 3, 4, 5]);
    assert.typeOf(result, "array");
  });

  it("should return a subset of the scond array", function() {
    var result = getCommonItemsInArray([1, 2, 3], [1, 2, 3, 4, 5]);
    assert.deepEqual(result, [1, 2, 3]);
  });

  it("should return an empty array", function() {
    var result = getCommonItemsInArray([6, 7, 8], [1, 2, 3, 4, 5]);
    assert.deepEqual(result, []);
  });
});
