var Artist = require('./artist')
var Queue = require('./queue')
var Top = require('./top')
var spotify = require('./spotify')

/**
 * Similar entry.
 * @constructor
 * @param {string} entry - The artist to search for.
 */
function Similar (entry) {
  /**
   * Artist query.
   */
  this.artist = null

  /**
   * Number of tracks to fetch per artist.
   */
  this.artistLimit = 20

  /**
   * Entry string.
   */
  this.entry = null

  /**
   * Related artists response.
   */
  this.relatedArtistsResponse = null

  /**
   * Number of tracks to fetch per artist.
   */
  this.trackLimit = 5

  this.entry = entry.trim()
}

/**
 * Create a queue of tracks.
 * @return {Promise | Queue} A queue of tracks.
 */
Similar.prototype.createQueue = function () {
  var self = this
  var artists = self.relatedArtistsResponse.artists.map(function (item) {
    var top = new Top(self.entry)
    top.setLimit(self.trackLimit)
    top.setID(item.id)
    return top
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
  return this.searchForArtist().then(function () {
    return self.searchForRelatedArtists()
  }).then(function () {
    return self.createQueue()
  })
}

/**
 * Spotify ID.
 * @return {string} The Spotify ID of the artist,
 * or `-1` if not available.
 */
Similar.prototype.id = function () {
  if (this.artist) {
    return this.artist.id()
  } else {
    return -1
  }
}

/**
 * Search for artist.
 * @return {Promise} A Promise to perform the action.
 */
Similar.prototype.searchForArtist = function () {
  this.artist = new Artist(this.entry)
  return this.artist.searchForArtist()
}

/**
 * Search for related artists.
 * @return {Promise} A Promise to perform the action.
 */
Similar.prototype.searchForRelatedArtists = function () {
  var self = this
  return spotify.searchForRelatedArtists(this.id()).then(function (result) {
    self.relatedArtistsResponse = result
    return self
  })
}

/**
 * Set the number of tracks to fetch per artist.
 * @param {integer} limit - The maximum amount of tracks.
 */
Similar.prototype.setLimit = function (limit) {
  if (Number.isInteger(limit)) {
    this.trackLimit = limit
  }
}

module.exports = Similar
