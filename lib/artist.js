var Album = require('./album')
var Queue = require('./queue')
var spotify = require('./spotify')

/**
 * Artist entry.
 * @constructor
 * @param {string} entry - The artist to search for.
 */
function Artist (entry, limit) {
  /**
   * Artist response.
   */
  this.artistResponse = null

  /**
   * Albums response.
   */
  this.albumsResponse = null

  /**
   * Entry string.
   */
  this.entry = null

  /**
   * Number of tracks to fetch.
   */
  this.limit = null

  /**
   * Search response.
   */
  this.searchResponse = null

  this.entry = entry.trim()

  this.setLimit(limit)
}

/**
 * Create a queue of tracks.
 * @param {JSON} response - A JSON response object.
 * @return {Promise | Queue} A queue of tracks.
 */
Artist.prototype.createQueue = function () {
  var self = this
  var albums = self.albumsResponse.items.map(function (item) {
    var album = new Album(self.entry)
    album.setResponse(item)
    return album
  })
  var albumQueue = new Queue(albums)
  return albumQueue.dispatch()
}

/**
 * Dispatch entry.
 * @return {Promise | Queue} A queue of tracks.
 */
Artist.prototype.dispatch = function () {
  var self = this
  return this.searchForArtist().then(function () {
    return self.fetchAlbums()
  }).then(function () {
    return self.createQueue()
  })
}

/**
 * Fetch albums.
 * @return {Promise | JSON} A JSON response.
 */
Artist.prototype.fetchAlbums = function () {
  var self = this
  return spotify.getAlbumsByArtist(this.id()).then(function (result) {
    self.albumsResponse = result
    return self
  })
}

/**
 * Spotify ID.
 * @return {string} The Spotify ID of the artist,
 * or `-1` if not available.
 */
Artist.prototype.id = function () {
  if (this.searchResponse &&
      this.searchResponse.artists &&
      this.searchResponse.artists.items[0] &&
      this.searchResponse.artists.items[0].id) {
    return this.searchResponse.artists.items[0].id
  } else if (this.artistResponse &&
             this.artistResponse.id) {
    return this.artistResponse.id
  } else {
    return -1
  }
}

/**
 * Search for artist.
 * @return {Promise | JSON} A JSON response.
 */
Artist.prototype.searchForArtist = function () {
  var self = this
  if (this.searchResponse) {
    return Promise.resolve(this.searchResponse)
  } else if (this.artistResponse) {
    return Promise.resolve(this.artistResponse)
  } else {
    return spotify.searchForArtist(this.entry).then(function (result) {
      self.searchResponse = result
      return self
    })
  }
}

/**
 * Set the number of tracks to fetch.
 * @param {integer} limit - The maximum amount of tracks.
 */
Artist.prototype.setLimit = function (limit) {
  if (Number.isInteger(limit)) {
    this.limit = limit
  }
}

/**
 * Set the JSON response.
 * @param {JSON} response - The response.
 */
Artist.prototype.setResponse = function (response) {
  if (response &&
      response.artists &&
      response.artists.items[0] &&
      response.artists.items[0].id) {
    this.searchResponse = response
  } else if (response &&
             response.id) {
    this.artistResponse = response
  } else if (response &&
             response.items) {
    this.albumsResponse = response
  }
}

module.exports = Artist
