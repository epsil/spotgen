var util = require('util')
  , recopy = require('cli-regexp').copy
  , shared = require('./shared')
  , complex = shared.complex
  , taint = shared.taint
  , untaint = shared.untaint;

/**
 *  Merge two complex objects recursively.
 *
 *  If either source or target are non-complex
 *  (not an array or map) then nothing is done.
 *
 *  Otherwise all properties are merged from source
 *  into target.
 *
 *  For arrays, iteration is done over the array
 *  values so additional properties set on the array
 *  are not copied over.
 *
 *  If a cyclical reference is detected this method
 *  will throw an error.
 *
 *  @param source The source object.
 *  @param target The target object.
 *  @param options Options or filter function.
 */
module.exports = function merge(source, target, options) {
  var filter;
  if(typeof options === 'function') {
    filter = options;
    options = {};
  }
  options = options || {};
  filter = filter ||
    function(target, key, value, source) {
      if(!options.copy) {
        if(Array.isArray(target[key]) && Array.isArray(source)) {
          return target[key];
        }else if(complex(target[key]) && complex(source)) {
          return target[key];
        }
      }
      target[key] = value;
    };
  if(!complex(source) || !complex(target)) return;
  function create(target, key, source) {
    if(typeof(source.clone) == 'function') return source.clone();
    return Array.isArray(source) ? source.slice(0) :
     ((source instanceof RegExp) ? recopy(source) : {});
  }
  function recurse(source, target, key, value) {
    if(complex(source[key])) {
      if(source[key].__visited) {
        untaint(source[key]);
        throw new Error(util.format(
          'Cyclical reference detected on %s, cannot merge', key));
      }
      var val = create(target, key, source[key]);
      filter(target, key, options.copy ? val : target[key], source[key]);
      merge(source[key], options.copy ? val : target[key], options);
    }
  }
  function iterate(source, target, key, value) {
    taint(source);
    filter(target, key, value, source[key]);
    try {
      recurse(source, target, key, value);
    }catch(e) {
      untaint(source);
      throw e;
    }
    untaint(source);
  }
  if(Array.isArray(source)) {
    source.forEach(function(value, index, array) {
      iterate(source, target, index, value);
    });
  }else{
    for(var k in source) {
      iterate(source, target, k, source[k]);
    }
  }
  return target;
}

