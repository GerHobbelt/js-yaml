'use strict';


var assert = require('assert');


function testHandler(actual) {
  var expected = testHandler.expected;

  assert.strictEqual(actual.length, expected.length);

  assert.strictEqual(actual.length, expected.length);

  assert.strictEqual(
    actual[0].v,
    expected[0].v);

  assert.strictEqual(
    actual[0].f(10, 20),
    expected[0].f(10, 20));

  assert.strictEqual(
    actual[0].c(10, 20),
    expected[0].c(10, 20));

  assert.deepEqual(
    actual[0].e('book'),
    expected[0].e('book'));
}

testHandler.expected = [
  {
    v: 42,
    f: function (x, y) {
      return x + y;
    },
    c: function (x, y) { return x + y; },
    e: function (foo) {
      var result = 'There is my ' + foo + ' at the table.';

      return {
        first: 42,
        second: 'sum',
        third: result
      };
    }
  }
];


module.exports = testHandler;
