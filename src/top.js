var Artist = require('./artist')
var Queue = require('./queue')
var SpotifyRequestHandler = require('./spotify')
var Track = require('./track')

/**
 * Top entry.
 * @constructor
 * @param {string} entry - The artist to search for.
 */
function Top (spotify, entry) {
  /**
   * Artist query.
   */
  this.artist = null

  /**
   * Entry string.
   */
  this.entry = null

  /**
   * Spotify ID.
   */
  this.id = -1

  /**
   * Number of tracks to fetch.
   */
  this.limit = null

  /**
   * Top tracks response.
   *
   * [Reference](https://developer.spotify.com/web-api/get-artists-top-tracks/#example).
   */
  this.topTracksResponse = null

  /**
   * Spotify request handler.
   */
  this.spotify = spotify || new SpotifyRequestHandler()

  this.entry = entry.trim()
}

/**
 * Create a queue of tracks.
 * @param {JSON} response - A JSON response object.
 * @return {Promise | Queue} A queue of tracks.
 */
Top.prototype.createQueue = function () {
  var self = this
  var tracks = self.topTracksResponse.tracks.map(function (item) {
    var track = new Track(this.spotify, self.entry)
    track.setResponse(item)
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
  return this.spotify.getTopTracks(this.getID()).then(function (result) {
    self.topTracksResponse = result
    return self
  })
}

/**
 * Spotify ID.
 * @return {string} The Spotify ID of the artist,
 * or `-1` if not available.
 */
Top.prototype.getID = function () {
  return this.id
}

/**
 * Search for the artist's ID if not known.
 * @return {Promise} A Promise to perform the action.
 */
Top.prototype.searchForArtist = function () {
  if (this.getID() !== -1) {
    return Promise.resolve(this.getID())
  } else {
    var self = this
    this.artist = new Artist(this.spotify, this.entry)
    return this.artist.searchForArtist().then(function () {
      self.setID(self.artist.id())
    })
  }
}

/**
 * Set Spotify ID.
 * @param {string} id - The Spotify ID of the artist.
 */
Top.prototype.setID = function (id) {
  this.id = id
}

/**
 * Set the number of tracks to fetch.
 * @param {integer} limit - The maximum amount of tracks.
 */
Top.prototype.setLimit = function (limit) {
  if (Number.isInteger(limit)) {
    this.limit = limit
  }
}

module.exports = Top
