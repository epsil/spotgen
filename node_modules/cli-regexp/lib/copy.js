/**
 *  Copy a regular expression.
 *
 *  @param input The regular expression to copy.
 *
 *  Returns a copy of the input regular expression.
 */
function copy(input) {
  var ptn = input.source
    , flags = "";
  if(input.global) {
    flags += "g";
  }
  if(input.ignoreCase) {
    flags += "i";
  }
  if(input.multiline) {
    flags += "m";
  }
  return new RegExp(ptn, flags);
}

module.exports = copy;
