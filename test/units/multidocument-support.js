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
});
