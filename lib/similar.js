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
   * Albums response.
   */
  this.albumsResponse = null

  /**
   * Number of tracks to fetch per artist.
   */
  this.artistLimit = 20

  /**
   * Search response.
   */
  this.artistResponse = null

  /**
   * Related artists response.
   */
  this.relatedArtistsResponse = null

  /**
   * Entry string.
   */
  this.entry = null

  /**
   * Number of tracks to fetch per artist.
   */
  this.trackLimit = 5

  /**
   * Artist entry.
   */
  this.artist = null

  this.entry = entry.trim()
}

/**
 * Create a queue of tracks.
 * @param {JSON} response - A JSON response object.
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
  if (this.artistResponse &&
      this.artistResponse.artists &&
      this.artistResponse.artists.items[0] &&
      this.artistResponse.artists.items[0].id) {
    return this.artistResponse.artists.items[0].id
  } else {
    return -1
  }
}

/**
 * Whether a JSON response is an albums response.
 * @param {JSON} response - A JSON response object.
 * @return {boolean} `true` if `response` is an albums response,
 * `false` otherwise.
 */
Similar.prototype.isAlbumsResponse = function (response) {
  return response &&
    response.items
}

/**
 * Whether a JSON response is an artist search response.
 * @param {JSON} response - A JSON response object.
 * @return {boolean} `true` if `response` is an artist search response,
 * `false` otherwise.
 */
Similar.prototype.isSearchResponse = function (response) {
  return response &&
    response.artists &&
    response.artists.items[0] &&
    response.artists.items[0].id
}

/**
 * Whether a JSON response is a top tracks response.
 * @param {JSON} response - A JSON response object.
 * @return {boolean} `true` if `response` is a top tracks response,
 * `false` otherwise.
 */
Similar.prototype.isTopTracksResponse = function (response) {
  return response &&
    response.tracks
}

Similar.prototype.isRelatedArtistsResponse = function (response) {
  return response &&
    response.artists
}

/**
 * Search for artist.
 * @param {string} query - The query text.
 * @return {Promise | JSON} A JSON response.
 */
Similar.prototype.searchForArtist = function () {
  this.artist = new Artist(this.entry)
  return this.artist.searchForArtist()
}

Similar.prototype.searchForRelatedArtists = function () {
  // https://api.spotify.com/v1/artists/{id}/related-artists
  var self = this
  var id = self.artist.id()
  var url = 'https://api.spotify.com/v1/artists/'
  url += encodeURIComponent(id) + '/related-artists'
  return spotify.request(url).then(function (response) {
    if (self.isRelatedArtistsResponse(response)) {
      self.relatedArtistsResponse = response
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
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
