var Artist = require('./artist')
var Queue = require('./queue')
var Top = require('./top')

/**
 * Similar entry.
 * @constructor
 * @param {SpotifyWebApi} spotify - Spotify web API.
 * @param {string} entry - The artist to search for.
 * @param {string} [id] - The Spotify ID, if known.
 */
function Similar (spotify, entry, id, trackLimit, artistLimit) {
  /**
   * Array of related artists.
   */
  this.artists = null

  /**
   * Number of artists to fetch.
   */
  this.artistLimit = 20

  /**
   * Entry string.
   */
  this.entry = null

  /**
   * Spotify ID.
   */
  this.id = ''

  /**
   * Number of tracks to fetch per artist.
   */
  this.trackLimit = 5

  /**
   * Spotify request handler.
   */
  this.spotify = null

  this.entry = entry.trim()
  this.id = id
  this.spotify = spotify
  this.trackLimit = trackLimit || this.trackLimit
  this.artistLimit = artistLimit || this.artistLimit
}

/**
 * Create a queue of tracks.
 * @return {Promise | Queue} A queue of tracks.
 */
Similar.prototype.createQueue = function () {
  var self = this
  var artists = this.artists.map(function (artist) {
    return new Top(self.spotify, self.entry, artist.id, self.limit)
  })
  var queue = new Queue(artists)
  queue = queue.slice(0, self.artistLimit)
  return queue.dispatch().then(function (result) {
    return result.interleave()
  })
}

/**
 * Dispatch entry.
 * @return {Promise | Queue} A queue of tracks.
 */
Similar.prototype.dispatch = function () {
  var self = this
  return this.searchArtists().then(function () {
    return self.getArtistRelatedArtists()
  }).then(function () {
    return self.createQueue()
  })
}

/**
 * Search for artist.
 * @return {Promise} A Promise to perform the action.
 */
Similar.prototype.searchArtists = function () {
  var self = this
  var artist = new Artist(this.spotify, this.entry)
  return artist.searchArtists().then(function (artist) {
    self.id = artist.id
  })
}

/**
 * Search for related artists.
 * @return {Promise} A Promise to perform the action.
 */
Similar.prototype.getArtistRelatedArtists = function () {
  var self = this
  return this.spotify.getArtistRelatedArtists(this.id).then(function (response) {
    self.artists = response.body.artists
    return self
  })
}

module.exports = Similar
