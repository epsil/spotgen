var Artist = require('./artist')
var Queue = require('./queue')
var SpotifyRequestHandler = require('./spotify')
var Track = require('./track')

/**
 * Top entry.
 * @constructor
 * @param {string} entry - The artist to search for.
 * @param {string} [id] - The Spotify ID, if known.
 * @param {string} [limit] - The number of tracks to fetch.
 */
function Top (spotify, entry, id, limit) {
  /**
   * Entry string.
   */
  this.entry = null

  /**
   * Spotify ID.
   */
  this.id = ''

  /**
   * Number of tracks to fetch.
   */
  this.limit = null

  /**
   * Top tracks.
   */
  this.tracks = null

  /**
   * Spotify request handler.
   */
  this.spotify = null

  this.entry = entry.trim()
  this.id = id
  this.limit = limit
  this.spotify = spotify || new SpotifyRequestHandler()
}

/**
 * Create a queue of tracks.
 * @param {JSON} response - A JSON response object.
 * @return {Promise | Queue} A queue of tracks.
 */
Top.prototype.createQueue = function () {
  var self = this
  var tracks = this.tracks.map(function (item) {
    var track = new Track(this.spotify, self.entry)
    track.clone(item)
    return track
  })
  var trackQueue = new Queue(tracks)
  if (self.limit) {
    trackQueue = trackQueue.slice(0, self.limit)
  }
  return trackQueue
}

/**
 * Dispatch entry.
 * @return {Promise | Queue} A queue of tracks.
 */
Top.prototype.dispatch = function () {
  var self = this
  return this.searchForArtist().then(function () {
    return self.fetchTopTracks()
  }).then(function () {
    return self.createQueue()
  })
}

/**
 * Fetch top tracks.
 * @return {Promise | JSON} A JSON response.
 */
Top.prototype.fetchTopTracks = function () {
  var self = this
  return this.spotify.getTopTracks(this.id).then(function (response) {
    self.tracks = response.tracks
    return self
  })
}

/**
 * Search for the artist's ID if not known.
 * @return {Promise} A Promise to perform the action.
 */
Top.prototype.searchForArtist = function () {
  var self = this
  if (this.id) {
    return Promise.resolve(this)
  } else {
    var artist = new Artist(this.spotify, this.entry)
    return artist.searchForArtist().then(function (artist) {
      self.id = artist.id
      return self
    })
  }
}

module.exports = Top
