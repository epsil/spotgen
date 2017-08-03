var Album = require('./album')
var Queue = require('./queue')
var SpotifyRequestHandler = require('./spotify')
var sort = require('./sort')

/**
 * Artist entry.
 * @constructor
 * @param {SpotifyRequestHandler} spotify - Spotify request handler.
 * @param {string} entry - The artist to search for.
 * @param {string} [id] - The Spotify ID, if known.
 * @param {string} [limit] - The number of albums to fetch.
 */
function Artist (spotify, entry, id, limit) {
  /**
   * Array of albums.
   */
  this.albums = null

  /**
   * Entry string.
   */
  this.entry = ''

  /**
   * Spotify ID.
   */
  this.id = ''

  /**
   * Number of tracks to fetch.
   */
  this.limit = null

  /**
   * The artist name.
   */
  this.name = ''

  /**
   * Spotify request handler.
   */
  this.spotify = null

  this.entry = entry.trim()
  this.id = id
  this.limit = limit
  this.name = entry
  this.spotify = spotify || new SpotifyRequestHandler()
}

/**
 * Clone a JSON response.
 * @param {Object} response - The response.
 */
Artist.prototype.clone = function (response) {
  for (var prop in response) {
    if (response.hasOwnProperty(prop)) {
      this[prop] = response[prop] || this[prop]
    }
  }
}

/**
 * Create a queue of tracks.
 * @param {JSON} response - A JSON response object.
 * @return {Promise | Queue} A queue of tracks.
 */
Artist.prototype.createQueue = function () {
  var self = this
  var albums = self.albums.map(function (item) {
    var album = new Album(self.spotify, self.entry)
    album.clone(item)
    return album
  })
  var albumQueue = new Queue(albums)
  if (self.limit) {
    albumQueue = albumQueue.slice(0, self.limit)
  }
  return albumQueue.forEachPromise(function (album) {
    return album.getPopularity()
  }).then(function () {
    albumQueue = albumQueue.sort(sort.album)
    return albumQueue.dispatch()
  }).then(function (queue) {
    return queue.flatten().filter(function (track) {
      return track.hasArtist(self.name)
    })
  })
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
Artist.prototype.fetchAlbums = function (id) {
  id = id || this.id
  var self = this
  if (this.albums) {
    return Promise.resolve(this)
  } else {
    return this.spotify.getArtistAlbums(id).then(function (response) {
      self.albums = response.items
      self.id = id
      return self
    })
  }
}

/**
 * Search for artist.
 * @return {Promise | JSON} A JSON response.
 */
Artist.prototype.searchForArtist = function () {
  var self = this
  if (this.id) {
    return Promise.resolve(this)
  } else {
    return this.spotify.searchArtists(this.entry).then(function (response) {
      if (response &&
          response.artists &&
          response.artists.items &&
          response.artists.items[0]) {
        response = response.artists.items[0]
        self.clone(response)
        return Promise.resolve(self)
      } else {
        return Promise.reject(response)
      }
    }).catch(function () {
      if (self.entry.match(/^[0-9a-z]+$/i)) {
        return self.fetchAlbums(self.entry)
      } else {
        return Promise.reject(null)
      }
    })
  }
}

module.exports = Artist
