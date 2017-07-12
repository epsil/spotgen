var util = {}

/**
 * Identity function.
 * @param {Object} x - A value.
 * @return {Object} - The same value.
 */
util.identity = function (x) {
  return x
}

/**
 * Create a pair.
 * @param {Object} x - The first value.
 * @param {Object} y - The second value.
 * @return {Object} - A pair of values.
 */
util.pair = function (x, y) {
  return {
    first: x,
    second: y
  }
}

/**
 * Get the first value of a pair.
 * @param {Object} pair - A pair of values.
 * @return {Object} - The first value.
 */
util.first = function (pair) {
  return pair.first
}

/**
 * Get the second value of a pair.
 * @param {Object} pair - A pair of values.
 * @return {Object} - The second value.
 */
util.second = function (pair) {
  return pair.second
}

/**
 * Replace Unicode characters with their ASCII equivalents.
 * @param {string} x - A string.
 * @return {string} - A new string.
 */
util.toAscii = function (str) {
  return str.replace(/[\u2018\u2019\u00b4]/g, "'")
    .replace(/[\u201c\u201d\u2033]/g, '"')
    .replace(/[\u2212\u2022\u00b7\u25aa]/g, '-')
    .replace(/[\u2013\u2015]/g, '-')
    .replace(/\u2014/g, '-')
    // .replace(/[\u2013\u2015]/g, '--')
    // .replace(/\u2014/g, '---')
    .replace(/\u2026/g, '...')
    .replace(/[ ]+\n/g, '\n')
    .replace(/\s*\\\n/g, '\\\n')
    .replace(/\s*\\\n\s*\\\n/g, '\n\n')
    .replace(/\s*\\\n\n/g, '\n\n')
    .replace(/\n-\n/g, '\n')
    .replace(/\n\n\s*\\\n/g, '\n\n')
    .replace(/\n\n\n*/g, '\n\n')
    .replace(/[ ]+$/gm, '')
    .replace(/^\s+|[\s\\]+$/g, '')
}

module.exports = util
