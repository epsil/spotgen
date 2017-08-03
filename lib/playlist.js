var Queue = require('./queue')
var SpotifyRequestHandler = require('./spotify')
var Track = require('./track')

/**
 * Create playlist entry.
 * @constructor
 * @param {SpotifyRequestHandler} spotify - Spotify request handler.
 * @param {string} entry - The playlist to search for.
 * @param {string} [id] - The Spotify ID, if known.
 * @param {string} [limit] - The number of tracks to fetch.
 */
function Playlist (spotify, entry, id, owner, limit) {
  /**
   * Entry string.
   */
  this.entry = ''

  /**
   * The ID of the playlist.
   */
  this.id = ''

  /**
   * Playlist tracks.
   */
  this.items = null

  /**
   * Number of tracks to fetch.
   */
  this.limit = null

  /**
   * Spotify request handler.
   */
  this.spotify = null

  /**
   * The user who owns the playlist.
   */
  this.owner = {}

  /**
   * Spotify URI
   * (a string on the form `spotify:user:xxxxxxxx:playlist:xxxxxxxxxxxxxxxxxxxxxx`).
   */
  this.uri = ''

  this.entry = entry.trim()
  this.id = id || this.id
  this.limit = limit
  this.owner.id = owner || this.owner.id
  this.spotify = spotify || new SpotifyRequestHandler()
  this.uri = (this.owner.id && this.id) ? ('spotify:user:' + this.owner.id + ':playlist:' + this.id) : this.uri
}

/**
 * Clone a JSON response.
 * @param {Object} response - The response.
 */
Playlist.prototype.clone = function (response) {
  for (var prop in response) {
    if (response.hasOwnProperty(prop) &&
        prop !== 'limit') {
      this[prop] = response[prop] || this[prop]
    }
  }
}

/**
 * Create a queue of tracks.
 * @param {JSON} response - A JSON response object.
 * @return {Promise | Queue} A queue of tracks.
 */
Playlist.prototype.createQueue = function () {
  var self = this
  var tracks = this.items.map(function (item) {
    var track = new Track(self.spotify, self.entry)
    track.clone(item.track)
    return track
  })
  var queue = new Queue(tracks)
  if (self.limit) {
    queue = queue.slice(0, self.limit)
  }
  return queue
}

/**
 * Dispatch entry.
 * @return {Promise | Queue} A queue of tracks.
 */
Playlist.prototype.dispatch = function () {
  var self = this
  return this.searchForPlaylist().then(function () {
    return self.fetchPlaylist()
  }).then(function () {
    return self.createQueue()
  })
}

/**
 * Fetch playlist tracks.
 * @return {Promise | JSON} A JSON response.
 */
Playlist.prototype.fetchPlaylist = function (id, owner) {
  id = id || this.id
  owner = owner || (this.owner && this.owner.id)
  var self = this
  return this.spotify.getPlaylist(owner, id).then(function (response) {
    self.clone(response)
    return self
  })
}

/**
 * Search for playlist.
 * @return {Promise | JSON} A JSON response, or `null` if not found.
 */
Playlist.prototype.searchForPlaylist = function () {
  var self = this
  if (this.id && this.owner && this.owner.id) {
    return Promise.resolve(this)
  } else {
    return this.spotify.searchPlaylists(this.entry).then(function (response) {
      if (response &&
          response.playlists &&
          response.playlists.items &&
          response.playlists.items[0]) {
        response = response.playlists.items[0]
        self.clone(response)
        return Promise.resolve(self)
      } else {
        return Promise.reject(response)
      }
    }).catch(function () {
      // console.log('COULD NOT FIND ' + self.entry)
      return Promise.reject(null)
    })
  }
}

module.exports = Playlist
