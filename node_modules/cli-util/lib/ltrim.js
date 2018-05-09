module.exports = function ltrim(str) {
  if(!str || typeof str !== 'string') return str;
  return str.replace(/^\s+/, '');
}
