'use strict';

var assert = require('assert');
var path   = require('path');
var fs     = require('fs');
var yaml   = require('../');


function unindent(m, index) {
    if (!m || m[index + 1] === undefined) {
        return null;
    }
    var mode = m[index];
    var content = m[index + 1];
    switch (mode) {
    case '':
        return content;

    case '(<)':
        // content is indented; extract indent from the first line, which is probably `    ---`:
        console.warn("(<) content:", content);
        // The next regex construct is a little nasty:
        // test RTP8, f.e., has a leading comment at column 1, which we 
        // thus skip: the regex picks up the first indented line, whether it's
        // the first or second, or third... etc. in there:
        var indent = /\n(\s+)/.exec("\n" + content)[1];
        console.warn("unindent level:", indent.length);
        content = content.replace(RegExp("^" + indent, "gm"), "");
        return content;

    case '(+)':
        // content is not indented; maybe there's a bit of chomping to do?:
        console.warn("(+) content:", content);
        return content;

    case '(<+)':
        // content is indented; extract indent from the first line, which is probably `    ---`:
        var indent = /^(\s+)/.exec(content)[1];
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
    spec = spec.replace(/\r\n/g, '\n') + '\n--- XXX\n';

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
        ")?--- test-event\n([^]*)",                 // [15]: tokens
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
    for (var i = 1; ; i++) {
        switch (i) {
        case 1:
            overrideFile = 'inYaml';
            overrideData = inYaml;
            break;

        case 2:
            overrideFile = 'inJSON';
            overrideData = inJson;
            break;
            
        case 3:
            overrideFile = 'inError';
            overrideData = inError;
            break;
            
        case 4:
            overrideFile = 'outYaml';
            overrideData = outYaml;
            break;
            
        case 5:
            overrideFile = 'emitYaml';
            overrideData = emitYaml;
            break;
            
        default:
            overrideFile = null;
            overrideData = null;
            break;
        }
        if (!overrideFile) break;

        var overrideFilePath = path.resolve(samplesDir, path.basename(specFile, ".tml") + '.' + overrideFile + '.data');
        if (updateSollwertFiles > 0 && (updateSollwertFiles === 1 || !fs.existsSync(overrideFilePath)) && overrideData != null) {
            fs.writeFileSync(overrideFilePath, overrideData, { encoding: 'utf8' });
        }
        else if (updateSollwertFiles < 0 && fs.existsSync(overrideFilePath)) {
            hasOverrides = true;
            overrideData = fs.readFileSync(overrideFilePath, { encoding: 'utf8' });

            switch (i) {
            case 1:
                inYaml = overrideData;
                break;

            case 2:
                inJson = overrideData;
                break;
                
            case 3:
                inError = overrideData;
                break;
                
            case 4:
                outYaml = overrideData;
                break;
                
            case 5:
                emitYaml = overrideData;
                break;
                
            default:
                throw new Error("internal error; should never get here");
            }
        }
    }

    var expectedJson = null;

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
    
    // return;


    test(title + " (from " + from + ") [" + path.basename(specFile, ".tml") + "]" + (hasOverrides ? " [OVERRIDE]" : ""), function () {
      var actual = [];
      var expected = expectedJson;
      var expectedError = inError;

      var returned;
      try {
          returned = yaml.safeLoadAll(inYaml,
            function (doc /*, index, state/options */) {
              actual.push(doc);
            }, {
              filename: specFile,
              // schema: TEST_SCHEMA
            }
          );
      } catch (ex) {
          if (expectedError) {
              // expect only this error and nothing else: always a single document
              assert.strictEqual(actual.length, 0);
              return;
          }
          // otherwise unexpected error: rethrow for the test rig to catch:
          throw ex;
      }

      if (actual.length === 1) actual = actual[0];
      if (returned && returned.length === 1) returned = returned[0];

      assert.deepEqual(actual, expected);
      assert.deepEqual(returned, expected);
    });
  });
});
