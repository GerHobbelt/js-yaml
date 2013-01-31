'use strict';


var NIL  = require('../../common').NIL;
var Type = require('../../type');


function resolveJavascriptFunction(object, explicit) {
  /*jslint evil:true*/
  var func;
  
  try {
    func = new Function('return ' + object);
    return func();
  } catch (error) {
    return NIL;
  }
}


module.exports = new Type('tag:yaml.org,2002:js/function', resolveJavascriptFunction);