/**
 *  Convert the first character of a string to uppercase.
 *
 *  @param val The string value.
 */
module.exports = function ucfirst(val) {
  if(!val || !typeof val === 'string') return val;
  return val.charAt(0).toUpperCase() + val.slice(1);
}
