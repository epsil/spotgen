/**
 *  Repeat a string.
 *
 *  @param len The number of times to repeat.
 *  @param str The string to repeat, default is a space.
 */
module.exports = function repeat(len, str) {
  len = typeof len !== 'number' ? 2 : len;
  len = Math.abs(len);
  return new Array(len + 1).join(str || ' ');
}
