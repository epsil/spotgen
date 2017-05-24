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
  return {first: x, second: y}
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

module.exports = util
