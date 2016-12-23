var Album = require('./album')
var Queue = require('./queue')
var Track = require('./track')
var spotify = require('./spotify')

/**
 * Artist entry.
 * @constructor
 * @param {string} entry - The artist to search for.
 */
function Artist (entry) {
  /**
   * Albums response.
   */
  this.albumsResponse = null

  /**
   * Search response.
   */
  this.artistResponse = null

  /**
   * Entry string.
   */
  this.entry = null

  /**
   * Number of tracks to fetch.
   */
  this.limit = null

  /**
   * Top tracks response.
   */
  this.topTracksResponse = null

  this.entry = entry.trim()
}

/**
 * Create a queue of tracks.
 * @param {JSON} response - A JSON response object.
 * @return {Promise | Queue} A queue of tracks.
 */
Artist.prototype.createQueue = function (response) {
  var self = this
  if (self.isTopTracksResponse(response)) {
    var tracks = response.tracks.map(function (item) {
      return new Track(self.entry, item)
    })
    var trackQueue = new Queue(tracks)
    if (self.limit) {
      trackQueue = trackQueue.slice(0, self.limit)
    }
    return trackQueue
  } else {
    var albums = response.items.map(function (item) {
      return new Album(self.entry, item)
    })
    var albumQueue = new Queue(albums)
    return albumQueue.dispatch()
  }
}

/**
 * Dispatch entry.
 * @return {Promise | Queue} A queue of tracks.
 */
Artist.prototype.dispatch = function () {
  var self = this
  if (self.limit) {
    return this.searchForArtist(this.entry).then(function () {
      return self.fetchTopTracks()
    }).then(function (response) {
      return self.createQueue(response)
    })
  } else {
    return this.searchForArtist(this.entry).then(function () {
      return self.fetchAlbums()
    }).then(function (response) {
      return self.createQueue(response)
    })
  }
}

/**
 * Fetch albums.
 * @return {Promise | JSON} A JSON response.
 */
Artist.prototype.fetchAlbums = function () {
  var id = this.id()
  var url = 'https://api.spotify.com/v1/artists/'
  url += encodeURIComponent(id) + '/albums'
  var self = this
  return spotify.request(url).then(function (response) {
    if (self.isAlbumsResponse(response)) {
      self.albumsResponse = response
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

/**
 * Fetch top tracks.
 * @return {Promise | JSON} A JSON response.
 */
Artist.prototype.fetchTopTracks = function () {
  var id = this.id()
  var url = 'https://api.spotify.com/v1/artists/'
  url += encodeURIComponent(id) + '/top-tracks?country=US'
  var self = this
  return spotify.request(url).then(function (response) {
    if (self.isTopTracksResponse(response)) {
      self.topTracksResponse = response
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

/**
 * Spotify ID.
 * @return {string} The Spotify ID of the artist,
 * or `-1` if not available.
 */
Artist.prototype.id = function () {
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
Artist.prototype.isAlbumsResponse = function (response) {
  return response &&
    response.items
}

/**
 * Whether a JSON response is an artist search response.
 * @param {JSON} response - A JSON response object.
 * @return {boolean} `true` if `response` is an artist search response,
 * `false` otherwise.
 */
Artist.prototype.isSearchResponse = function (response) {
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
Artist.prototype.isTopTracksResponse = function (response) {
  return response &&
    response.tracks
}

/**
 * Search for artist.
 * @param {string} query - The query text.
 * @return {Promise | JSON} A JSON response.
 */
Artist.prototype.searchForArtist = function (query) {
  // https://developer.spotify.com/web-api/search-item/
  var url = 'https://api.spotify.com/v1/search?type=artist&q='
  url += encodeURIComponent(query)
  var self = this
  return spotify.request(url).then(function (response) {
    if (self.isSearchResponse(response)) {
      self.artistResponse = response
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
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

module.exports = Artist
