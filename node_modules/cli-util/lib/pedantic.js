module.exports = function pedantic(value, period) {
  period = period || '.';
  value = /[a-zA-Z0-9]$/.test(value) ? value + period : value
  // sane if it ends with some common punctuation.
  var sane = /[!?:;\.]([\*`]+)?$/.test(value);
  if(!sane) {
    // close on markdown inline formatters
    value = /[^\.][\)\]\*`]+$/.test(value) ? value + period : value;
  }
  return value;
}

