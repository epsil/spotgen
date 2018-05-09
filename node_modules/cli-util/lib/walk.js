var assert = require('assert')
  , shared = require('./shared')
  , complex = shared.complex
  , taint = shared.taint
  , untaint = shared.untaint;

module.exports = function walk(root, visit, transform, visited) {
  assert(typeof root === 'object', 'root must be an object');
  assert(typeof visit === 'function', 'visit must be a function');
  assert(typeof transform === 'function', 'transform must be a function');
  visited = visited || [];
  var k, v, props;
  for(k in root) {
    v = root[k];
    props = {parent: root, name: k, value: v};
    if(complex(v) && v.__visited) {
      throw new Error('walk: cyclical reference detected');
    }
    if(visit(props)) {
      taint(v);
      try {
        transform(props);
      }catch(e) {
        untaint(v);
        throw e;
      }
    }
    if(complex(v)) {
      walk(v, visit, transform, visited);
      untaint(v);
    }
  }
}

