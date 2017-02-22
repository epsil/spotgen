var request = require('./request')

module.exports = function (key) {
  var lastfm = {}

  /**
   * Get the Last.fm metadata for a track.
   * @param {String} artist - The artist.
   * @param {String} title - The title.
   * @param {boolean} [correct] - Whether to autocorrect misspellings,
   * default true.
   * @return {Promise | JSON} The track info.
   */
  lastfm.getInfo = function (artist, title, correct) {
    correct = (correct !== false)
    artist = encodeURIComponent(artist)
    title = encodeURIComponent(title)
    key = encodeURIComponent(key)

    // http://www.last.fm/api/show/track.getInfo
    var url = 'https://ws.audioscrobbler.com/2.0/?method=track.getInfo'
    url += '&api_key=' + key
    url += '&artist=' + artist
    url += '&track=' + title
    url += '&format=json'

    return lastfm.request(url).then(function (result) {
      if (result && !result.error && result.track) {
        return Promise.resolve(result)
      } else {
        return Promise.reject(result)
      }
    })
  }

  /**
   * Perform a Last.fm request.
   * @param {string} url - The URL to look up.
   */
  lastfm.request = function (url) {
    console.log(url.replace('&api_key=' + key, ''))
    return request(url)
  }

  return lastfm
}
