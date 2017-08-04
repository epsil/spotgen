var Artist = require('./artist')
var Queue = require('./queue')
var sort = require('./sort')
var Track = require('./track')

/**
 * Top entry.
 * @constructor
 * @param {SpotifyWebApi} spotify - Spotify web API.
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
  this.spotify = spotify
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
  return this.searchArtists().then(function () {
    return self.getArtistTopTracks()
  }).then(function () {
    return self.createQueue()
  })
}

/**
 * Fetch top tracks.
 * @return {Promise | JSON} A JSON response.
 */
Top.prototype.getArtistTopTracks = function (country) {
  country = country || 'US'
  var self = this
  return this.spotify.getArtistTopTracks(this.id, country).then(function (response) {
    sort(response.body.tracks, sort.popularity)
    self.tracks = response.body.tracks
    return self
  })
}

/**
 * Search for the artist's ID if not known.
 * @return {Promise} A Promise to perform the action.
 */
Top.prototype.searchArtists = function () {
  var self = this
  if (this.id) {
    return Promise.resolve(this)
  } else {
    var artist = new Artist(this.spotify, this.entry)
    return artist.searchArtists().then(function (artist) {
      self.id = artist.id
      return self
    })
  }
}

module.exports = Top
