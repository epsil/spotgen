var XRegExp = require('xregexp')
var _ = require('lodash')

var util = {}

/**
 * Lightly clean up a string's contents.
 * @param {string} str - A string.
 * @return {string} A new string.
 */
util.normalize = function (str) {
  str = util.replacePunctuation(str)
  str = util.stripWhitespace(str)
  return str
}

/**
 * Get all entries in a Spotify paging object.
 *
 * [Reference](https://developer.spotify.com/web-api/object-model/#paging-object).
 *
 * @param {SpotifyWebApi} [spotify] - Spotify web API.
 * @param {Function} [method] - Method to call.
 * @param {array} args Array of method arguments.
 * @param {Object} [opts] The options supplied to this request.
 * @returns {Promise | JSON} A promise that, if successful,
 * resolves to a JSON object that contains all the entries.
 */
util.paging = function (spotify, method, args, opts, result) {
  opts = opts || {}
  return method.apply(spotify, args.concat([opts])).then(function (response) {
    if (!response) {
      return Promise.reject(response)
    }
    if (result) {
      result.body.items = result.body.items.concat(response.body.items)
    } else {
      result = response
    }
    if (response.body.next) {
      opts.offset = result.body.items.length
      return util.paging(spotify, method, args, opts, result)
    } else {
      return Promise.resolve(result)
    }
  })
}

/**
 * Replace Unicode punctuation with their ASCII equivalents.
 * @param {string} str - A string.
 * @return {string} - A new string.
 */
util.replacePunctuation = function (str) {
  str = str.replace(/[\u2018\u2019\u00b4]/gi, "'")
    .replace(/[\u201c\u201d\u2033]/gi, '"')
    .replace(/[\u2212\u2022\u00b7\u25aa]/gi, '-')
    .replace(/[\u2013\u2015]/gi, '-')
    .replace(/\u2014/gi, '-')
    .replace(/\u2026/gi, '...')
  return str
}

/**
 * Remove string noise.
 * @param {string} str - A string.
 * @return {string} A new string.
 */
util.stripNoise = function (str) {
  str = util.normalize(str)
  str = str.replace(/].*/gi, ']')
    .replace(/\).*/gi, ')')
    .replace(/^[0-9]+\. /gi, '')
    .replace(/\[[^\]]*]/gi, '')
    .replace(/\([^)]*\)/gi, '')
    .replace(/-+/gi, '-')
    .replace(/\.+/gi, '.')
  str = util.stripPunctuation(str)
  str = util.stripWhitespace(str)
  return str
}

/**
 * Remove superfluous punctuation characters.
 * @param {string} str - A string.
 * @return {string} - A new string.
 */
util.stripPunctuation = function (str, keep) {
  keep = keep || '-\'.'
  keep = _.escapeRegExp(keep)
  if (XRegExp) {
    str = str.replace(XRegExp('[^' + keep + '\\s\\w\\pL]', 'gi'), '')
  } else {
    str = str.replace(new RegExp('[^' + keep + '\\s\\w]', 'gi'), '')
  }
  return str
}

/**
 * Clean up a string's whitespace.
 * @param {string} str - A string.
 * @return {string} A new string.
 */
util.stripWhitespace = function (str) {
  str = str || ''
  str = str.trim()
  str = str.replace(/[\s]+/g, ' ')
  return str
}

/**
 * Replace Unicode characters with their ASCII equivalents.
 * @param {string} str - A string.
 * @return {string} - A new string.
 */
util.toAscii = function (str) {
  str = _.deburr(str)
  str = util.replacePunctuation(str)
  str = str.replace(/[^\w\s-]/gi, '')
  return str.trim()
}

module.exports = util
