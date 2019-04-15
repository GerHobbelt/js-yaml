'use strict';


var assert = require('assert');
var yaml   = require('../../');


suite('Multidocument source using `loadAll`', function () {
  test('should produce all documents', function () {
    var docs = yaml.loadAll('---\nfoo: bar\n---\nfoo: bar\n');
    assert.strictEqual(docs.length, 2);
    var expected = [ { foo: 'bar' }, { foo: 'bar' } ];
    assert.deepEqual(docs, expected);
  });

  test('should produce all documents even when all are empty', function () {
    var docs = yaml.loadAll('--- # first document\n--- # second document\n');
    assert.strictEqual(docs.length, 2);
    var expected = [ null, null ];
    assert.deepEqual(docs, expected);
  });

  test('should produce all documents (2)', function () {
    var docs = yaml.loadAll('foo: bar\n---\nfoo: bar\n');
    assert.strictEqual(docs.length, 2);
    var expected = [ { foo: 'bar' }, { foo: 'bar' } ];
    assert.deepEqual(docs, expected);
  });

  test('should produce all documents (3)', function () {
    var docs = yaml.loadAll('foo: bar\n...\nbar: bla bla\n\nx: y\n\nz: bogus\n...\nfoo: bar\n...\nfoo\n\nfoo');
    assert.strictEqual(docs.length, 4);
    var expected = [ { foo: 'bar' }, { bar: 'bla bla', x: 'y', z: 'bogus' }, { foo: 'bar' }, 'foo\nfoo' ];
    assert.deepEqual(docs, expected);
  });

  test('should fire the specified document listener for every document', function () {
    var count = 0;
    var posCheck = [ [ 0, 9 ], [ 13, 42 ], [ 46, 55 ], [ 59, 68 ] ];

    function docListener(doc, index, state) {
      assert.strictEqual(index, count);
      count++;

      assert.strictEqual(state.documentStart, posCheck[index][0]);
      assert.strictEqual(state.position, posCheck[index][1]);
    }

    var docs = yaml.loadAll('foo: bar\n...\nbar: bla bla\n\nx: y\n\nz: bogus\n...\nfoo: bar\n...\nfoo\n\nfoo',
      docListener, {
        // also store position information: this test does double duty that way...
        metaKey: 'coord'
      });

    var expected = [
      {
        coord: {
          foo: {
            startLine: 0,
            startPos: 0
          }
        },
        foo: 'bar'
      },
      {
        coord: {
          bar: {
            startLine: 2,
            startPos: 13
          },
          x: {
            startLine: 4,
            startPos: 27
          },
          z: {
            startLine: 6,
            startPos: 33
          }
        },
        bar: 'bla bla',
        x: 'y',
        z: 'bogus'
      },
      {
        coord: {
          foo: {
            startLine: 8,
            startPos: 46
          }
        },
        foo: 'bar'
      },
      'foo\nfoo'
    ];
    assert.strictEqual(count, 4);
    assert.strictEqual(docs.length, 4);
    assert.deepEqual(docs, expected);
  });

  test('should support cursor forwarding in the document listener', function () {
    var count = 0;
    var posCheck = [ [ 0, 9 ], [ 46, 55 ] ];

    function docListener(doc, index, state) {
      assert.strictEqual(index, count);
      count++;

      assert.strictEqual(state.documentStart, posCheck[index][0]);
      assert.strictEqual(state.position, posCheck[index][1]);

      var pos1 = state.input.indexOf('...\n', state.position);
      assert.strictEqual(pos1, state.position);
      var pos2 = state.input.indexOf('\n...\n', pos1);
      if (pos2 < 0) {
        // EOF reached in content chunk:
        pos2 = state.length;
      } else {
        pos2++;     // skip first LF
      }

      // position the cursor at the start of the marker (iff it's a `...` or `---` marker),
      // at least before the next LF:
      state.position = pos2;
      // extra: also patch the `lineStart` value:
      state.lineStart = pos2;

      // update the line count for correct line tracking in diagnostic reports:
      var content = state.input.slice(pos1, pos2);
      var lines = content.split('\n');
      state.line += lines.length - 1;

      // augment the document YAML (& strip off lead and tail markers):
      // (js-yaml has added an extra LF at the end of your content, so we always
      // step back 1 from the end, hence the unconditional `-1` for the `.slice()`)
      content = content.slice(4, -1);
      doc.__content__ = content;

      // signal to the js-yaml library that we expect another YAML chunk coming up next!
      return true;
    }

    var docs = yaml.loadAll('foo: bar\n...\nbar: bla bla\n\nx: y\n\nz: bogus\n...\nfoo: bar\n...\nfoo\n\nfoo',
      docListener, {
        // also store position information: this test does double duty that way...
        metaKey: 'coord'
      });

    var expected = [
      {
        coord: {
          foo: {
            startLine: 0,
            startPos: 0
          }
        },
        foo: 'bar',
        __content__: 'bar: bla bla\n\nx: y\n\nz: bogus'
      },
      {
        coord: {
          foo: {
            startLine: 8,
            startPos: 46
          }
        },
        foo: 'bar',
        __content__: 'foo\n\nfoo'
      }
    ];
    assert.strictEqual(count, 2);
    assert.strictEqual(docs.length, 2);
    assert.deepEqual(docs, expected);
  });
});
