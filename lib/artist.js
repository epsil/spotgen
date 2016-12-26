var Album = require('./album')
var Queue = require('./queue')
var Track = require('./track')
var spotify = require('./spotify')

/**
 * Artist entry.
 * @constructor
 * @param {string} entry - The artist to search for.
 */
function Artist (entry, response) {
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

  /**
   * Top tracks response.
   */
  this.topTracksResponse = null

  this.entry = entry.trim()

  if (this.isSearchResponse(response)) {
    this.searchResponse = response
  } else if (this.isArtistResponse(response)) {
    this.artistResponse = response
  } else if (this.isAlbumsResponse(response)) {
    this.albumsResponse = response
  } else if (this.isTopTracksResponse(response)) {
    this.topTracksResponse = response
  }
}

/**
 * Create a queue of tracks.
 * @param {JSON} response - A JSON response object.
 * @return {Promise | Queue} A queue of tracks.
 */
Artist.prototype.createQueue = function () {
  var self = this
  if (self.topTracksResponse) {
    var tracks = self.topTracksResponse.tracks.map(function (item) {
      return new Track(self.entry, item)
    })
    var trackQueue = new Queue(tracks)
    if (self.limit) {
      trackQueue = trackQueue.slice(0, self.limit)
    }
    return trackQueue
  } else {
    var albums = self.albumsResponse.items.map(function (item) {
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
  return this.searchForArtist().then(function () {
    return self.fetchData()
  }).then(function () {
    return self.createQueue()
  })
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
 * Fetch data.
 * @return {Promise | JSON} A JSON response.
 */
Artist.prototype.fetchData = function () {
  if (this.limit) {
    return this.fetchTopTracks()
  } else {
    return this.fetchAlbums()
  }
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
 * Whether a JSON response is an artist response.
 * @param {JSON} response - A JSON response object.
 * @return {boolean} `true` if `response` is an artist response,
 * `false` otherwise.
 */
Artist.prototype.isArtistResponse = function (response) {
  return response &&
    response.id
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
 * @return {Promise | JSON} A JSON response.
 */
Artist.prototype.searchForArtist = function () {
  if (this.searchResponse) {
    return Promise.resolve(this.searchResponse)
  } else if (this.artistResponse) {
    return Promise.resolve(this.artistResponse)
  } else {
    // https://developer.spotify.com/web-api/search-item/
    var url = 'https://api.spotify.com/v1/search?type=artist&q='
    url += encodeURIComponent(this.entry)
    var self = this
    return spotify.request(url).then(function (response) {
      if (self.isSearchResponse(response)) {
        self.searchResponse = response
        return Promise.resolve(response)
      } else {
        return Promise.reject(response)
      }
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

module.exports = Artist
