/**
 *  Convert a camelcase string to a delimited string.
 *
 *  @param name The string to convert.
 *  @param delimiter A delimiter, default is hyphen.
 *  @param lower Whether to lowercase the result.
 */
module.exports = function delimited(name, delimiter, lower) {
  var re  = /([A-Z]{1,1})/g;
  delimiter = delimiter || '-';
  name = name.replace(re, delimiter + '$1');
  if(lower) name = name.toLowerCase();
  return name;
}

