'use strict';

var assert = require('assert');
var path   = require('path');
var fs     = require('fs');
var yaml   = require('../');


//////////////////////////////////////////////////////////////////
//
// Define a custom Type for the custom Schema we use to handle
// the 'unknown tags' in the test specs.
// 

var Type = yaml.Type;

var testType1 = new Type('!foo', {
  kind: 'scalar'
});

var testType2 = new Type('tag:example.com,2000:app/foo', {
  kind: 'scalar'
});

var testType3 = new Type('tag:clarkevans.com,2002:invoice', {
  kind: 'mapping'
});

var testType4 = new Type('tag:example.com,2000:app/int', {
  kind: 'scalar'
});

var testType5 = new Type('!local', {
  kind: 'scalar'
});

var testType6 = new Type('tag:clarkevans.com,2002:circle', {
  kind: 'mapping'
});

var testType7 = new Type('!something', {
  kind: 'scalar'
});

var testType8 = new Type('!my-light', {
  kind: 'scalar'
});

var testType9 = new Type('tag:clarkevans.com,2002:line', {
  kind: 'mapping'
});

var testType10 = new Type('tag:clarkevans.com,2002:label', {
  kind: 'mapping'
});

var testType11 = new Type('tag:example.com,2000:app/tag%21', {
  kind: 'scalar'
});

var testType12 = new Type('tag:clarkevans.com,2002:shape', {
  kind: 'sequence'
});



var Schema = yaml.Schema;

// schema: TEST_SCHEMA
var customSchema = Schema.create(yaml.DEFAULT_SAFE_SCHEMA, [testType1, testType2, testType3, testType4, testType5, testType6, testType7, testType8, testType9, testType10, testType11, testType12]); 

///////////////////////////////////////////////////////////////////



function getIndentDepth(content) {
    // The next regex construct is a little nasty:
    // test RTP8, f.e., has a leading comment at column 1, which we 
    // thus skip: the regex picks up the first indented line, whether it's
    // the first or second, or third... etc. in there.
    // 
    // WARNING: the `content` we received MAY BE EMPTY! Hence the regex
    // MAY NOT match!
    var m = /\n([ \t]+)/.exec("\n" + content);
    return (m ? m[1] : '');
}

function unindent(m, index) {
    if (!m || m[index + 1] === undefined) {
        return void 0;
    }
    var mode = m[index];
    var content = m[index + 1];
    switch (mode) {
    case '':
        return content;

    case '(<)':
        // content is indented; extract indent from the first line, which is probably `    ---`:
        console.warn("(<) content:", content);
        var indent = getIndentDepth(content);
        console.warn("unindent level:", indent.length);
        content = content.replace(RegExp("^" + indent, "gm"), "");
        return content;

    case '(+)':
        // content is not indented; maybe there's a bit of chomping to do?:
        console.warn("(+) content:", content);
        return content;

    case '(<+)':
        // content is indented; extract indent from the first line, which is probably `    ---`:
        var indent = getIndentDepth(content);
        console.warn("(<+) unindent level:", indent.length);
        content = content.replace(RegExp("^" + indent, "gm"), "");

        // maybe there's a bit of chomping to do?:
        console.warn("(<+) content:", content);
        return content;

    default:
        throw new Error("unknown spec section mode: " + mode);
    }
}

suite('YAML 1.2 Test Suite', function () {
  var samplesDir = path.resolve(__dirname, 'yaml-test-suite');

  fs.readdirSync(samplesDir).forEach(function (specFile) {
    if (path.extname(specFile) !== '.tml') return; // continue

    var filePath = path.resolve(samplesDir, specFile);
    console.warn({
        specFile,
        filePath
    });
    var spec = fs.readFileSync(filePath, { encoding: 'utf8' });
    spec = spec
    .replace(/\r\n/g, '\n')
    .replace(/<SPC>/g, ' ' /* '\u00A0' */)
    .replace(/<TAB>/g, '\t')
     + '\n--- XXX\n';

    var re = RegExp([
        "=== ([^]*)",                               // [1]: title
        "--- from: ([^]*)",                         // [2]: from
        "--- tags: ([^\n]*)",                       // [3]: tags
        "([^]*)",                                   // [4]: optional comments
        "--- in-yaml([^\n]*)\n([^]*?)",             // [5]: (<)        [6]: yaml
        "(?:--- in-json([^\n]*)\n([^]*?)",          // [7]: (<)        [8]: json
        ")?(?:--- (error\n)([^]*?)",                // [9]: error\n    [10]: error message (always empty?)
        ")?(?:--- out-yaml([^\n]*)\n([^]*?)",       // [11]: (<)       [12]: yaml
        ")?(?:--- emit-yaml([^\n]*)\n([^]*?)",      // [13]: (<)       [14]: yaml
        // some files show a different order of sections, where in-json follows at the end...
        ")?(?:--- in-json([^\n]*)\n([^]*?)",        // [15]: (<)       [16]: yaml  
        ")?--- test-event\n([^]*)",                 // [17]: tokens
        "--- XXX"
    ].join("\n"));
    var m = re.exec(spec);
    if (!m) {
        throw new Error("yaml-test-suite TML regex does not parse the spec file " + specFile + ", please check and augment the regex");
    }

    var title = (m && m[1]);
    var from = (m && m[2]);
    var tags = (m && m[3]);
    var comments = (m && m[4]);
    var inYaml = unindent(m, 5);
    var inJson = unindent(m, 7);
    var inError = (m && m[9] && ("E:" + m[10]));        // inError is guaranteed non-empty when error block was specified.
    var outYaml = unindent(m, 11);
    var emitYaml = unindent(m, 13);
    if (inJson == null) {
      inJson = unindent(m, 15);
    }

    console.warn("scanned spec:", {
        title,
        from,
        tags,
        comments,
        inYaml,
        inJson,
        inError,
        outYaml,
        emitYaml,
        spec,
        m
    });

    // now do a quick check to see if we got all sections out of there:
    assert(title);
    assert(from);
    assert(tags);
    assert(spec.indexOf('--- in-yaml') >= 0);
    assert(inYaml != null);
    assert(typeof inYaml === 'string');
    assert(spec.indexOf('--- in-json') >= 0 ? inJson != null : inJson == null, "inJSON expectation");
    assert(spec.indexOf('--- out-yaml') >= 0 ? outYaml != null : outYaml == null, "outYAML expectation");
    assert(spec.indexOf('--- emit-yaml') >= 0 ? emitYaml != null : emitYaml == null, "emitYAML expectation");
    assert(spec.indexOf('--- error') >= 0 ? inError != null : inError == null, "outERROR expectation");
    
    if (typeof inYaml !== 'string') {
        throw new Error("yaml-test-suite TML spec file " + specFile + " did not produce an INPUT YAML section. Please check and fix the test (or test rig).");
    }

    // detect override files for input, output, error, etc.
    // 
    // Development Helper: 
    // 
    // set the 'updateSollwertFiles' constant to 1 to rewrite 
    // or 2 to write-but-do-not-overwrite the overrides! 
    // Set to 0 (zero) to disable all overrides; 
    // -1 to load any overrides present in the test spec directory.
    // 
    var updateSollwertFiles = -1;
    var hasOverrides = false;
    var overrideFile;
    var overrideData;

    var overrideFilePath = path.resolve(samplesDir, path.basename(specFile, ".tml") + '.override.data');
    
    function saveOverrideFile() {
        if (updateSollwertFiles > 0 && (updateSollwertFiles === 1 || !fs.existsSync(overrideFilePath))) {
            // only write an 'override' file when there's some override logged:
            if (overrideData.hasNewOverrides) {
                delete overrideData.hasNewOverrides;

                // clean up and prep any Error instance in `expectedError`:
                if (overrideData.expectedError instanceof Error) {
                    overrideData.expectedErrorException = overrideData.expectedError;
                    var msg = overrideData.expectedError.message;
                    var colpos = msg.indexOf(':');
                    if (colpos >= 0) {
                        msg = msg.slice(colpos + 1);
                    }
                    overrideData.expectedError = msg.replace(/([^":.]+)/, '$1').trim();
                }

                // also check the validity of the `expectedJSON` blob: some tests produce
                // Time/Date stamps which do NOT transport well into JSON text, hence we then
                // must force the test rig to do a (formatted) JSON **string compare**:
                if (overrideData.expectedJSON !== void 0) {
                    var obj = overrideData.expectedJSON;
                    var objstr = JSON.stringify(obj, null, 2);
                    try {
                        assert.deepEqual(JSON.parse(objstr), obj);
                    } catch (ex) {
                        overrideData.outputMustBeJSONstringCompared = true;
                    }
                }

                fs.writeFileSync(overrideFilePath, JSON.stringify(overrideData, null, 2), { encoding: 'utf8' });
            }
        }
    }

    if (updateSollwertFiles !== 0 && fs.existsSync(overrideFilePath)) {
        hasOverrides = true;
        overrideData = fs.readFileSync(overrideFilePath, { encoding: 'utf8' });
        overrideData = JSON.parse(overrideData);
    }
    overrideData = overrideData || {};

    // now determine the reference values for the expected error & output(s):
    
    var expectedJson = void 0;
    var expectedYaml = void 0;
    var expectedError = inError;

    if (inJson) {
        try {
            // decode spec JSON for single document test specs:
            expectedJson = JSON.parse(inJson);
        } catch (ex) {
            var multidocJson = inJson
            .replace(/\n\{/g, ',\n{')    // doc delivers object
            .replace(/\n\[/g, ',\n[')    // doc delivers array
            .replace(/\n"/g, ',\n"')     // doc delivers string
            .replace(/\nnull/g, ',\nnull')     // doc delivers NULL
            ;
            multidocJson = "[\n" + multidocJson + "\n]";
            // console.warn("multidoc json spec:", multidocJson);
            expectedJson = JSON.parse(multidocJson);
        }
    }           

    if (emitYaml) {
        expectedYaml = emitYaml;
    } else if (outYaml) {
        expectedYaml = outYaml;
    } else {
        // round trip should produce the input, as no output reference
        // has been specified.
        // UNLESS, of course, when we expect an error!
        expectedYaml = inYaml;
    }

    // we prefer to check the *parsed* YAML as we dump/output YAML that's
    // not exactly like the stuff written in the spec files, so comparing
    // YAML input with the round-tripped stuff is only a last resort in
    // the test rig.
    if (expectedJson === void 0) {
        try {
            // decode spec YAML if possible:
            expectedJson = yaml.safeLoadAll(expectedYaml, null, {
                lenient: true,
                schema: customSchema,
            });
            if (expectedJson && expectedJson.length === 1) expectedJson = expectedJson[0];
        } catch (ex) {
            // regrettably we cannot parse the reference YAML either...
            console.error("Regrettably we cannot parse the reference YAML:", expectedYaml, ex);
            expectedJson = void 0;
        }
    }

    console.warn("Picking reference output:", {
        file: specFile,
        inJSON: inJson,
        outYAML: outYaml,
        emitYAML: emitYaml,
        expectedJSON: expectedJson,
        expectedYAML: expectedYaml, 
        overrides: overrideData,
    });

    if (overrideData.expectedJSON !== void 0) {
        expectedJson = overrideData.expectedJSON;
    }

    if (overrideData.expectedError !== void 0) {
        expectedError = overrideData.expectedError;
    }

    // return;

    // if (specFile.indexOf('SU5Z') >= 0) throw new Error(1);

    test(title + " (from " + from + ") [" + path.basename(specFile, ".tml") + "]" + (hasOverrides ? " [OVERRIDE]" : ""), function () {
      var actual = [];

      var returned;

      // flag the overrides as TO BE UPDATED:
      // 
      // any unexpected fault in here will thus cause the override file to be updated/written (IFF allowed!)
      // 
      overrideData.hasNewOverrides = true;

      try {
          try {
              // 
              // NOTE: `yaml.safeLoadAll()` CAN return `null` as a VALID result for empty input.
              // Hence we're careful to check against `undefined` (`void 0`) in this rig, as both
              // actual and expected values MAY legally be `null`... but NEVER `undefined` if the
              // JS-YAML API produced it as a value!
              // 
              returned = yaml.safeLoadAll(inYaml,
                function (doc /*, index, state/options */) {
                  actual.push(doc);
                }, {
                  filename: specFile,
                  lenient: true,
                  schema: customSchema,
                }
              );
          } catch (ex) {
              overrideData.expectedError = ex;

              if (expectedError) {
                  if (0) {
                      // expect only this error and nothing else: always a single document
                      assert.strictEqual(actual.length, 0, "JS-YAML produced an error AND output: " + JSON.stringify({
                          expectedError: expectedError,
                          yamlOutput: actual,
                          yamlError: ex
                      }, null, 2));
                  }

                  if (expectedError !== "E:") {
                      if (ex.message.indexOf(expectedError) < 0) {
                          assert.fail("Expected a specific error report, but got some other error: " + JSON.stringify({
                              expectedError: expectedError,
                              actualError: ex
                          }));
                      }
                  } else {
                      // default error treatment. 
                      // 
                      // We want this to be more specific, so a general error situation
                      // is explicitly upgraded to a specific one by override:
                      // saveOverrideFile();
                  }

                  return;
              }

              // otherwise unexpected error: rethrow for the test rig to catch:
              throw ex;
          }

          if (actual.length === 1) actual = actual[0];
          if (returned && returned.length === 1) returned = returned[0];

          // some tests produce Time/Date stamps which do NOT transport well 
          // into JSON text, hence we then must force the test rig to do a 
          // (formatted) JSON **string compare** (when we are employing 
          // a `expectedJSON` override):
          var actualStr, returnedStr, expectedJsonStr;
          if (overrideData.outputMustBeJSONstringCompared && expectedJson !== void 0) {
            actualStr = JSON.stringify(actual, null, 2);
            returnedStr = JSON.stringify(returned, null, 2);
            expectedJsonStr = JSON.stringify(expectedJson, null, 2);
          }

          if (expectedError) {
              // expect only this error but it didn't happen!
              // 
              // NOTE: as we MAY use override-files, we want to test the validity
              // of the actual js-yaml output anyway, using the potentially
              // available `expectedJson` file:

              overrideData.expectedError = false;
              overrideData.expectedJSON = actual;

              if (expectedJsonStr !== void 0) {
                  assert.equal(actualStr, expectedJsonStr, "JS-YAML did NOT produce an error while we DID expect an error to occur. Instead, JS-YAML did output: " + JSON.stringify({
                      expectedError: expectedError,
                      expectedJSON: expectedJson,
                      actualJSON: actual
                  }, null, 2));
              }
              else if (expectedJson !== void 0) {
                  assert.deepEqual(actual, expectedJson, "JS-YAML did NOT produce an error while we DID expect an error to occur. Instead, JS-YAML did output: " + JSON.stringify({
                      expectedError: expectedError,
                      expectedJSON: expectedJson,
                      actualJSON: actual
                  }, null, 2));
              }
              assert.fail("JS-YAML did NOT produce an error while we DID expect an error to occur. Instead, JS-YAML did output: " + JSON.stringify({
                  expectedError: expectedError,
                  expectedJSON: expectedJson,
                  actualJSON: actual
              }, null, 2));
          }

          // round-tripping for last resort test checking further below:
          // if we don't have anything that's JSON/object, then we try a 
          // basic YAML-to-YAML string compare to see if we got it right,
          // or rather: we do this to provide the user with a slightly more
          // comprehensible test error report, for we are pretty sure this
          // will fail the test as we format YAML differently.... :'-(
          var returnedYaml;
          try {
              returnedYaml = yaml.dump(actual, {
                  noCompatMode: true
              });
          } catch (ex) {
              console.warn("Did not expect an error from YAML.DUMP:", ex);
              // unexpected error: rethrow for the test rig to catch:
              throw ex;
          }

          overrideData.expectedJSON = actual;

          // only check the rewritten YAML when there's no JSON reference value to check:
          // we usually format YAML quite different from the spec files...
          if (expectedYaml !== void 0 && expectedJson === void 0) {
              assert.equal(returnedYaml, expectedYaml);
          }   
          else if (expectedJsonStr !== void 0) {
              assert.equal(actualStr, expectedJsonStr);
              assert.equal(returnedStr, expectedJsonStr);
          }
          else if (expectedJson !== void 0) {
              assert.deepEqual(actual, expectedJson);
              assert.deepEqual(returned, expectedJson);
          }
       } catch (ex2) {
          saveOverrideFile();

          // rethrow the error, so the test suite can observe the test failure
          throw ex2;
       }
    });
  });
});
