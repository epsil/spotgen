var ltrim = require('./ltrim')
  , repeat = require('./repeat')
  , eol = require('os').EOL

/**
 *  Word wrap a long string.
 *
 *  @param str The string to wrap.
 *  @param col The column to indent lines (first line is not indented).
 *  @param amount The amount to wrap at.
 *  @param first Also pad first line if column is greater than zero.
 */
module.exports = function wrap(str, col, amount, first) {
  if(!str || typeof str !== 'string') return str;
  if(isNaN(col) || isNaN(amount)) {
    throw new TypeError('Wrap cannot operate on NaN ' +
      (isNaN(col) ? 'column' : 'amount'));
  }
  amount = Math.abs(parseInt(amount)) || 80;
  amount = Math.max(amount, 2);
  col = parseInt(col) || 0;
  col = Math.max(col, 0);
  // guard against infinite loop if amount is less then column
  amount = Math.max(amount, col + 2);
  var padding = repeat(col);
  var target = amount - col;
  function block(str) {
    var over = str.length + col > amount;
    var parts = [];
    var words = str.split(' '), line = '', word;
    function append(line) {
      parts.push(
        parts.length ? (col > 0 ? padding : '') + ltrim(line) : line);
    }
    if(over) {
      var i, l = words.length;
      for(i = 0;i < l;i++) {
        word = words[i];
        // hyphenate long words that exceed
        // the target length limit
        if(word.length >= target) {
          if(word.length === target) {
            append(word);
          }else{
            line = word.substr(0, target - 1) + '-';
            words.splice(i + 1, 0, word.substr(target - 1));
            append(line);
            line = '';
            l++;
          }
          continue;
        }
        if((line + ' ' + word).length <= target) {
          line += line === '' ? word : ' ' + word;
        }else{
          append(line);
          line = '';
          i--;
        }
      }
      if(line !== '') append(line);
      return parts.join(eol).trim();
    }
    return !first ? str : padding + str;
  }
  var re = /\n+/, parts, past;
  if(!re.test(str)) {
    str = block(str);
  }else{
    // respect hard line breaks
    parts = str.split(eol);
    parts = parts.map(function(segment) {
      // empty string is multiple consecutive newlines
      if(!segment) return segment;
      segment = block(segment);
      if(past && col > 0) segment = padding + segment;
      past = true;
      return segment;
    })
    str = parts.join(eol);
  }
  return str;
}

