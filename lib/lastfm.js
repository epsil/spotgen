var http = require('./http')

module.exports = function (key) {
  var lastfm = {}

  /**
   * Get the Last.fm metadata for a track.
   *
   * [Reference](http://www.last.fm/api/show/track.getInfo).
   *
   * @param {String} artist - The artist.
   * @param {String} title - The title.
   * @param {boolean} [correct] - Whether to autocorrect misspellings,
   * default true.
   * @return {Promise | JSON} The track info.
   */
  lastfm.getInfo = function (artist, title, user, correct) {
    var uri = 'https://ws.audioscrobbler.com/2.0/?method=track.getInfo'
    correct = (correct === undefined) ? true : correct
    correct = correct ? 1 : 0
    return lastfm.request(uri, {
      qs: {
        artist: artist,
        track: title,
        user: user,
        autocorrect: correct,
        format: 'json'
      }
    }).then(function (result) {
      if (result && !result.error && result.track) {
        return Promise.resolve(result)
      } else {
        return Promise.reject(result)
      }
    })
  }

  /**
   * Perform a Last.fm request.
   * @param {string} uri - The URI to look up.
   */
  lastfm.request = function (uri, options) {
    console.log(uri +
                '&artist=' + encodeURIComponent(options.qs.artist) +
                '&track=' + encodeURIComponent(options.qs.track))
    options.qs.api_key = key
    return http(uri, options)
  }

  return lastfm
}
