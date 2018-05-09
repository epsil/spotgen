/**
 *  Does a string appear to be a regular expression (//gim).
 *
 *  @param ptn The string to test for appearing to be
 *  a regular expression.
 */
function seems(ptn) {
  // ("[^"\\]*(?:\\.[^"\\]*)*")
  var fre = /^\/([^\/\\]*(?:\\.?[^\/\\]*)*)\/([gim]*)$/;
  return fre.test(ptn || '');
}

module.exports = seems;
