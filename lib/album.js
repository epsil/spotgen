var Queue = require('./queue')
var Track = require('./track')
var spotify = require('./spotify')

/**
 * Create album entry.
 * @constructor
 * @param {string} entry - The album to search for.
 * @param {string} [response] - JSON album object.
 */
function Album (entry, limit) {
  /**
   * Entry string.
   */
  this.entry = entry.trim()

  /**
   * Number of albums to fetch.
   */
  this.limit = null

  this.setLimit(limit)
}

/**
 * Create a queue of tracks.
 * @param {JSON} response - A JSON response object.
 * @return {Promise | Queue} A queue of tracks.
 */
Album.prototype.createQueue = function () {
  var self = this
  var tracks = this.albumResponse.tracks.items.map(function (item) {
    var track = new Track(self.entry)
    track.setResponse(item)
    return track
  })
  var queue = new Queue(tracks)
  if (self.limit) {
    queue = queue.slice(0, self.limit)
  }
  return queue
}

/**
 * Dispatch entry.
 * @return {Promise | Queue} A queue of tracks.
 */
Album.prototype.dispatch = function () {
  var self = this
  return this.searchForAlbum().then(function () {
    return self.fetchAlbum()
  }).then(function () {
    return self.createQueue()
  })
}

/**
 * Fetch album metadata.
 * @return {Promise | JSON} A JSON response.
 */
Album.prototype.fetchAlbum = function () {
  var id = this.id()
  var url = 'https://api.spotify.com/v1/albums/'
  url += encodeURIComponent(id)
  var self = this
  return spotify.request(url).then(function (response) {
    if (self.isAlbumResponse(response)) {
      self.albumResponse = response
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

/**
 * Spotify ID.
 * @return {string} The Spotify ID of the album,
 * or `-1` if not available.
 */
Album.prototype.id = function () {
  if (this.albumResponse &&
      this.albumResponse.id) {
    return this.albumResponse.id
  } else if (this.searchResponse &&
             this.searchResponse.albums &&
             this.searchResponse.albums.items &&
             this.searchResponse.albums.items[0] &&
             this.searchResponse.albums.items[0].id) {
    return this.searchResponse.albums.items[0].id
  } else {
    return -1
  }
}

/**
 * Whether a JSON response is an album response.
 * @param {JSON} response - A JSON response object.
 * @return {boolean} `true` if `response` is an album response,
 * `false` otherwise.
 */
Album.prototype.isAlbumResponse = function (response) {
  return response &&
    response.id
}

/**
 * Whether a JSON response is an album search response.
 * @param {JSON} response - A JSON response object.
 * @return {boolean} `true` if `response` is an album search response,
 * `false` otherwise.
 */
Album.prototype.isSearchResponse = function (response) {
  return response &&
    response.albums &&
    response.albums.items[0] &&
    response.albums.items[0].id
}

/**
 * Search for album if not known.
 * @return {Promise | JSON} A JSON response, or `null` if not found.
 */
Album.prototype.searchForAlbum = function () {
  var self = this
  if (this.searchResponse) {
    return Promise.resolve(this.searchResponse)
  } else if (this.albumResponse) {
    return Promise.resolve(this.albumResponse)
  } else {
    // https://developer.spotify.com/web-api/search-item/
    var url = 'https://api.spotify.com/v1/search?type=album&q='
    url += encodeURIComponent(this.entry)
    return spotify.request(url).then(function (response) {
      if (self.isSearchResponse(response)) {
        self.searchResponse = response
        return Promise.resolve(response)
      } else {
        return Promise.reject(response)
      }
    }).then(null, function () {
      console.log('COULD NOT FIND ' + self.entry)
      return Promise.reject(null)
    })
  }
}

/**
 * Set the number of albums to fetch.
 * @param {integer} limit - The maximum amount of albums.
 */
Album.prototype.setLimit = function (limit) {
  if (Number.isInteger(limit)) {
    this.limit = limit
  }
}

/**
 * Set the JSON response.
 * @param {JSON} response - The response.
 */
Album.prototype.setResponse = function (response) {
  if (this.isSearchResponse(response)) {
    this.searchResponse = response
  } else if (this.isAlbumResponse(response)) {
    this.albumResponse = response
  }
}

module.exports = Album
