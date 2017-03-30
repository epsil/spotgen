var Queue = require('./queue')
var Track = require('./track')
var spotify = require('./spotify')

/**
 * Create album entry.
 * @constructor
 * @param {string} entry - The album to search for.
 * @param {string} [response] - JSON album object.
 */
function Playlist (user, playlist) {
  /**
   * Playlist ID.
   */
  this.playlist = playlist.trim()

  /**
   * Playlist response.
   *
   * [Reference](https://developer.spotify.com/web-api/get-playlists-tracks/).
   */
  this.response = null

  /**
   * User ID.
   */
  this.user = user.trim()
}

/**
 * Create a queue of tracks.
 * @param {JSON} response - A JSON response object.
 * @return {Promise | Queue} A queue of tracks.
 */
Playlist.prototype.createQueue = function () {
  var self = this
  var tracks = this.response.tracks.items.map(function (item) {
    var track = new Track(self.entry)
    track.setResponse(item)
    return track
  })
  var queue = new Queue(tracks)
  return queue
}

/**
 * Dispatch entry.
 * @return {Promise | Queue} A queue of tracks.
 */
Playlist.prototype.dispatch = function () {
  return this.fetchPlaylist().then(function () {
    return self.createQueue()
  })
}

/**
 * Fetch album metadata.
 * @return {Promise | JSON} A JSON response.
 */
Playlist.prototype.fetchPlaylist = function () {
  var self = this
  return spotify.getPlaylist(this.user, this.playlist).then(function (response) {
    self.response = response
    return self
  })
}

module.exports = Playlist
