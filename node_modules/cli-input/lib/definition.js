var merge = require('cli-util').merge;

/**
 *  Represents a prompt definition.
 */
var PromptDefinition = function(options) {
  options = options || {};
  var k, v;
  for(k in options) {
    if(typeof this[k] === 'function') {
      continue;
    }
    v = options[k];
    this[k] = v;
  }
}

/**
 *  Clone this prompt definition.
 *
 *  Uses the current state of this definition merged with
 *  any specified options.
 */
PromptDefinition.prototype.clone = function(options) {
  var o = merge(this, {}, {copy: true});
  if(options) o = merge(options, o);
  return new PromptDefinition(o);
}

module.exports = PromptDefinition;
