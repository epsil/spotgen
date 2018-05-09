function patch() {
  // add some util functions required by readline on 0.11.x series
  // not available in 0.10.x
  var util = require('util');
  util.isFunction = function(arg) {
    return typeof arg === 'function';
  }
  util.isUndefined = function(arg) {
    return arg === void 0;
  }
  util.isNumber = function(arg) {
    return typeof arg === 'number';
  }
  util.isBuffer = function(arg) {
    return arg instanceof Buffer;
  }
  return require('./readline');
}

module.exports = patch;
