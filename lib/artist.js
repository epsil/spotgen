var Album = require('./album')
var Queue = require('./queue')
var sort = require('./sort')
var util = require('./util')

/**
 * Artist entry.
 * @constructor
 * @param {SpotifyWebApi} spotify - Spotify web API.
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
  this.spotify = spotify
}

/**
 * Clone a JSON response.
 * @param {Object} response - The response.
 */
Artist.prototype.clone = function (response) {
  for (var prop in response) {
    if (response.hasOwnProperty(prop)) {
      this[prop] = response[prop]
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
  return this.searchArtists().then(function () {
    return self.getArtistAlbums()
  }).then(function () {
    return self.createQueue()
  })
}

/**
 * Fetch albums.
 * @return {Promise | JSON} A JSON response.
 */
Artist.prototype.getArtistAlbums = function (id) {
  id = id || this.id
  var self = this
  if (this.albums) {
    return Promise.resolve(this)
  } else {
    return util.paging(this.spotify, this.spotify.getArtistAlbums, [id]).then(function (response) {
      sort(response.body.items, sort.album)
      self.albums = response.body.items
      self.id = id
      return self
    })
  }
}

/**
 * Search for artist.
 * @return {Promise | JSON} A JSON response.
 */
Artist.prototype.searchArtists = function () {
  var self = this
  if (this.id) {
    return Promise.resolve(this)
  } else {
    return this.spotify.searchArtists(this.entry).then(function (response) {
      if (response &&
          response.body &&
          response.body.artists &&
          response.body.artists.items &&
          response.body.artists.items[0]) {
        // sort results by string similarity
        sort(response.body.artists.items, sort.similarArtist(self.entry))
        response = response.body.artists.items[0]
        self.clone(response)
        return Promise.resolve(self)
      } else {
        return Promise.reject(response)
      }
    }).catch(function () {
      if (self.entry.match(/^[0-9a-z]+$/i)) {
        return self.getArtistAlbums(self.entry)
      } else {
        console.log('COULD NOT FIND: ' + self.entry)
        return Promise.reject(null)
      }
    })
  }
}

module.exports = Artist
