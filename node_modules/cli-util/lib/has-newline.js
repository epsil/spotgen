/**
 *  Check a message and optionally parameters array
 *  for any newline characters.
 */
module.exports = function hasNewline(msg, parameters) {
  msg = msg || '';
  parameters = parameters || [];
  var newline = msg ? ~msg.indexOf('\n') : false, i;
  if(newline) return newline;
  // check parameters for a newline
  for(i = 0;i < parameters.length;i++) {
    if(/\n/.test(parameters[i])) {
      newline = true; break;
    }
  }
  return newline;
}

