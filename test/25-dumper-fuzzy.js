'use strict';

var assert = require('assert');
var fc     = require('fast-check');
var yaml   = require('../');

// Generate valid YAML instances for yaml.safeDump
var key = fc.string16bits();
var values = [
  key, fc.boolean(), fc.integer(), fc.double(),
  fc.constantFrom(null, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY)
];
var yamlArbitrary = fc.object({ key: key, values: values });

// Generate valid options for yaml.safeDump configuration
var dumpOptionsArbitrary = fc.record({
  skipInvalid: fc.boolean(),
  sortKeys: fc.boolean(),
  noRefs: fc.boolean(),
  noCompatMode: fc.boolean(),
  condenseFlow: fc.boolean(),
  indent: fc.integer(1, 80),
  flowLevel: fc.integer(-1, 10),
  styles: fc.record({
    '!!null': fc.constantFrom('lowercase', 'canonical', 'uppercase', 'camelcase'),
    '!!int': fc.constantFrom('decimal', 'binary', 'octal', 'hexadecimal'),
    '!!bool': fc.constantFrom('lowercase', 'uppercase', 'camelcase'),
    '!!float': fc.constantFrom('lowercase', 'uppercase', 'camelcase')
  }, { with_deleted_keys: true })
}, { with_deleted_keys: true })
  .map(function (instance) {
    if (instance.condenseFlow === true && instance.flowLevel !== undefined) { instance.flowLevel = -1; }
    return instance;
  });

suite('Properties', function () {
  test('Load from dumped should be the original object', function () {
    fc.assert(fc.property(
      yamlArbitrary,
      dumpOptionsArbitrary,
      function (obj, dumpOptions) {
        var yamlContent = yaml.safeDump(obj, dumpOptions);
        assert.strictEqual(typeof yamlContent, 'string');
        assert.deepStrictEqual(yaml.safeLoad(yamlContent), obj, 'mismatch for input `' + yamlContent + '`');
      }),
    { verbose: true });
  });
});


/*eslint-disable max-len*/
/*
     Property failed after 69 tests
{ seed: 1955227325, path: "68:2:2:2:1:3:2:2:4:3:3:3:3:3:3:4:4:3:3:3:3:4:5:3:10:10:9:8:8:8:8:8:8:8:9:9:9:9:9:9:9:9", endOnFailure: true }
Counterexample: [{"":{"$,":{}}},{"flowLevel":0}]
Shrunk 41 time(s)
Got error: AssertionError [ERR_ASSERTION]: { '': { '$': null, null: {} } } deepStrictEqual { '': { '$,': {} } }

Stack trace: AssertionError [ERR_ASSERTION]: { '': { '$': null, null: {} } } deepStrictEqual { '': { '$,': {} } }
    at W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\test\25-dumper-fuzzy.js:44:16
    at Property.predicate (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\fast-check\lib\check\property\Property.generated.js:34:105)
    at Property.run (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\fast-check\lib\check\property\Property.generic.js:19:31)
    at runIt (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\fast-check\lib\check\runner\Runner.js:84:32)
    at check (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\fast-check\lib\check\runner\Runner.js:175:11)
    at Object.assert (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\fast-check\lib\check\runner\Runner.js:179:15)
    at Context.<anonymous> (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\test\25-dumper-fuzzy.js:38:8)
    at callFn (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runnable.js:387:21)
    at Test.Runnable.run (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runnable.js:379:7)
    at Runner.runTest (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runner.js:535:10)
    at W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runner.js:653:12
    at next (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runner.js:447:14)
    at W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runner.js:457:7
    at next (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runner.js:362:14)
    at Immediate.<anonymous> (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runner.js:425:5)
    at runCallback (timers.js:794:20)
    at tryOnImmediate (timers.js:752:5)
    at processImmediate [as _immediateCallback] (timers.js:729:5)

Hint: Enable verbose mode in order to have the list of all failing values encountered during the run
  Error: Property failed after 69 tests
  { seed: 1955227325, path: "68:2:2:2:1:3:2:2:4:3:3:3:3:3:3:4:4:3:3:3:3:4:5:3:10:10:9:8:8:8:8:8:8:8:9:9:9:9:9:9:9:9", endOnFailure: true }
  Counterexample: [{"":{"$,":{}}},{"flowLevel":0}]
  Shrunk 41 time(s)
  Got error: AssertionError [ERR_ASSERTION]: { '': { '$': null, null: {} } } deepStrictEqual { '': { '$,': {} } }

  Stack trace: AssertionError [ERR_ASSERTION]: { '': { '$': null, null: {} } } deepStrictEqual { '': { '$,': {} } }
      at W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\test\25-dumper-fuzzy.js:44:16
      at Property.predicate (node_modules\fast-check\lib\check\property\Property.generated.js:34:105)
      at Property.run (node_modules\fast-check\lib\check\property\Property.generic.js:19:31)
      at runIt (node_modules\fast-check\lib\check\runner\Runner.js:84:32)
      at check (node_modules\fast-check\lib\check\runner\Runner.js:175:11)
      at Object.assert (node_modules\fast-check\lib\check\runner\Runner.js:179:15)
      at Context.<anonymous> (test\25-dumper-fuzzy.js:38:8)

  Hint: Enable verbose mode in order to have the list of all failing values encountered during the run
      at Object.throwIfFailed (node_modules\fast-check\lib\check\runner\utils\RunDetailsFormatter.js:108:11)
      at Object.assert (node_modules\fast-check\lib\check\runner\Runner.js:183:31)
      at Context.<anonymous> (test\25-dumper-fuzzy.js:38:8)












  1) Properties
       Load from dumped should be the original object:
     Property failed after 55 tests
{ seed: 54141159, path: "54:3:3:4:5:4:4:6:5:5:5:5:5:5:5:6:7:5:5:5:5:6:7:5:13:14:14:13:10:10:10:10:10:10:10:10:10:11:11:11:11:11:11", endOnFailure: true }
Counterexample: [{"":{"${":[]}},{"flowLevel":0}]
Shrunk 42 time(s)
Got error: YAMLException: missed comma between flow collection entries at line 1, column 8:
    {'': {${: []}}
           ^

Stack trace: YAMLException: missed comma between flow collection entries at line 1, column 8:
    {'': {${: []}}
           ^
    at generateError (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\lib\js-yaml\loader.js:183:10)
    at throwError (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\lib\js-yaml\loader.js:189:9)
    at readFlowCollection (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\lib\js-yaml\loader.js:747:7)
    at composeNode (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\lib\js-yaml\loader.js:1399:11)
    at readFlowCollection (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\lib\js-yaml\loader.js:775:7)
    at composeNode (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\lib\js-yaml\loader.js:1399:11)
    at readBlockMapping (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\lib\js-yaml\loader.js:1075:16)
    at composeNode (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\lib\js-yaml\loader.js:1398:12)
    at readDocument (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\lib\js-yaml\loader.js:1561:3)
    at loadDocuments (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\lib\js-yaml\loader.js:1629:5)
    at load (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\lib\js-yaml\loader.js:1642:19)
    at Object.safeLoad (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\lib\js-yaml\loader.js:1660:10)
    at W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\test\25-dumper-fuzzy.js:44:37
    at Property.predicate (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\fast-check\lib\check\property\Property.generated.js:34:105)
    at Property.run (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\fast-check\lib\check\property\Property.generic.js:19:31)
    at runIt (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\fast-check\lib\check\runner\Runner.js:84:32)
    at check (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\fast-check\lib\check\runner\Runner.js:175:11)
    at Object.assert (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\fast-check\lib\check\runner\Runner.js:179:15)
    at Context.<anonymous> (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\test\25-dumper-fuzzy.js:38:8)
    at callFn (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runnable.js:387:21)
    at Test.Runnable.run (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runnable.js:379:7)
    at Runner.runTest (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runner.js:535:10)
    at W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runner.js:653:12
    at next (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runner.js:447:14)
    at W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runner.js:457:7
    at next (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runner.js:362:14)
    at Immediate.<anonymous> (W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\node_modules\mocha\lib\runner.js:425:5)
    at runCallback (timers.js:794:20)
    at tryOnImmediate (timers.js:752:5)
    at processImmediate [as _immediateCallback] (timers.js:729:5)

Hint: Enable verbose mode in order to have the list of all failing values encountered during the run
  Error: Property failed after 55 tests
  { seed: 54141159, path: "54:3:3:4:5:4:4:6:5:5:5:5:5:5:5:6:7:5:5:5:5:6:7:5:13:14:14:13:10:10:10:10:10:10:10:10:10:11:11:11:11:11:11", endOnFailure: true }
  Counterexample: [{"":{"${":[]}},{"flowLevel":0}]
  Shrunk 42 time(s)
  Got error: YAMLException: missed comma between flow collection entries at line 1, column 8:
      {'': {${: []}}
             ^

  Stack trace: YAMLException: missed comma between flow collection entries at line 1, column 8:
      {'': {${: []}}
             ^
      at generateError (lib\js-yaml\loader.js:183:10)
      at throwError (lib\js-yaml\loader.js:189:9)
      at readFlowCollection (lib\js-yaml\loader.js:747:7)
      at composeNode (lib\js-yaml\loader.js:1399:11)
      at readFlowCollection (lib\js-yaml\loader.js:775:7)
      at composeNode (lib\js-yaml\loader.js:1399:11)
      at readBlockMapping (lib\js-yaml\loader.js:1075:16)
      at composeNode (lib\js-yaml\loader.js:1398:12)
      at readDocument (lib\js-yaml\loader.js:1561:3)
      at loadDocuments (lib\js-yaml\loader.js:1629:5)
      at load (lib\js-yaml\loader.js:1642:19)
      at Object.safeLoad (lib\js-yaml\loader.js:1660:10)
      at W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\js\js-yaml\test\25-dumper-fuzzy.js:44:37
      at Property.predicate (node_modules\fast-check\lib\check\property\Property.generated.js:34:105)
      at Property.run (node_modules\fast-check\lib\check\property\Property.generic.js:19:31)
      at runIt (node_modules\fast-check\lib\check\runner\Runner.js:84:32)
      at check (node_modules\fast-check\lib\check\runner\Runner.js:175:11)
      at Object.assert (node_modules\fast-check\lib\check\runner\Runner.js:179:15)
      at Context.<anonymous> (test\25-dumper-fuzzy.js:38:8)

  Hint: Enable verbose mode in order to have the list of all failing values encountered during the run
      at Object.throwIfFailed (node_modules\fast-check\lib\check\runner\utils\RunDetailsFormatter.js:108:11)
      at Object.assert (node_modules\fast-check\lib\check\runner\Runner.js:183:31)
      at Context.<anonymous> (test\25-dumper-fuzzy.js:38:8)




 */
