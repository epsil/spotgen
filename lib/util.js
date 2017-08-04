var util = {}

/**
 * Get all entries in a Spotify paging object.
 *
 * [Reference](https://developer.spotify.com/web-api/object-model/#paging-object).
 *
 * @param {SpotifyWebAPI} [spotify] - Spotify web API.
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

module.exports = util
