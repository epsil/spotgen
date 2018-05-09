/**
 *  Parse a string as a regular expression.
 *
 *  @param ptn The string representation of a regular expression.
 *
 *  Returns a regular expression.
 */
function parse(ptn) {
  ptn = '' + ptn;
  var fre = /([gim]+)$/
    , flags = '';
  if(fre.test(ptn)) {
    flags = fre.exec(ptn)[0];
  }
  ptn = ptn.replace(fre, '');
  ptn = ptn.replace(/^\//, '').replace(/\/$/, '');
  return new RegExp(ptn, flags);
}

module.exports = parse;
