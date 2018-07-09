'use strict';

var Type = require('../../type');
var Module = require('module');
var path = require('path');

function requireFromString(code, filename, opts) {
  if (typeof filename === 'object') {
    opts = filename;
    filename = null;
  }

  opts = opts || {};
  filename = filename || '';

  opts.appendPaths = opts.appendPaths || [];
  opts.prependPaths = opts.prependPaths || [];

  if (typeof code !== 'string') {
    throw new Error('code must be a string, not ' + typeof code);
  }

  var paths = Module._nodeModulePaths(path.dirname(filename));

  var parent = module.parent;
  var m = new Module(filename, parent);
  m.filename = filename;
  m.paths = [].concat(opts.prependPaths).concat(paths).concat(opts.appendPaths);
  m._compile(code, filename);

  var exports = m.exports;
  if (parent && parent.children) { parent.children.splice(parent.children.indexOf(m), 1); }

  return exports;
}

function resolveJavascriptModule(data) {
  if (data === null) return false;

  try {
    return requireFromString(data);
  } catch (err) {
    return false;
  }
}

function constructJavascriptModule(data) {
  return requireFromString(data);
}

function representJavascriptModule(object) {
  return object.toString();
}

function isModule() {
  return false;
}

module.exports = new Type('tag:yaml.org,2002:js/module', {
  kind: 'scalar',
  resolve: resolveJavascriptModule,
  construct: constructJavascriptModule,
  predicate: isModule,
  represent: representJavascriptModule
});
