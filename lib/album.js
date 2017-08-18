var Queue = require('./queue')
var Track = require('./track')
var sort = require('./sort')
var util = require('./util')

/**
 * Create album entry.
 * @constructor
 * @param {SpotifyWebApi} spotify - Spotify web API.
 * @param {string} entry - The album to search for.
 * @param {string} [id] - The Spotify ID, if known.
 * @param {string} [limit] - The number of tracks to fetch.
 */
function Album (spotify, entry, artist, name, id, limit) {
  /**
   * Entry string.
   */
  this.entry = ''

  /**
   * Whether to fetch tracks.
   */
  this.fetchTracks = true

  /**
   * Spotify ID.
   */
  this.id = ''

  /**
   * Number of albums to fetch.
   */
  this.limit = null

  /**
   * The album name.
   */
  this.name = ''

  /**
   * The album popularity.
   * @return {string} - The album popularity.
   */
  this.popularity = null

  /**
   * Spotify request handler.
   */
  this.spotify = null

  /**
   * Album tracks.
   */
  this.tracks = null

  /**
   * Spotify URI
   * (a string on the form `spotify:album:xxxxxxxxxxxxxxxxxxxxxx`).
   */
  this.uri = ''

  this.entry = entry.trim()
  this.name = name
  this.artist = artist
  this.id = id
  this.limit = limit
  this.spotify = spotify
  this.uri = this.id ? ('spotify:album:' + this.id) : this.uri
}

/**
 * Clone a JSON response.
 * @param {Object} response - The response.
 */
Album.prototype.clone = function (response) {
  for (var prop in response) {
    if (response.hasOwnProperty(prop)) {
      this[prop] = response[prop]
    }
  }
  if (response &&
      response.tracks &&
      response.tracks.items) {
    this.tracks = response.tracks.items
  }
}

/**
 * Create a queue of tracks.
 * @param {JSON} response - A JSON response object.
 * @return {Promise | Queue} A queue of tracks.
 */
Album.prototype.createQueue = function () {
  var self = this
  var tracks = this.tracks.map(function (item) {
    var track = new Track(self.spotify, self.entry)
    track.clone(item)
    track.album = self.name
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
  if (this.fetchTracks) {
    return this.getTracks().then(function () {
      return self.createQueue()
    })
  } else {
    return this.searchAlbums()
  }
}

/**
 * Fetch album metadata.
 * @return {Promise | JSON} A JSON response.
 */
Album.prototype.getAlbum = function (id) {
  id = id || this.id
  var self = this
  if (Number.isInteger(this.popularity)) {
    return Promise.resolve(this)
  } else {
    return this.spotify.getAlbum(id).then(function (response) {
      self.clone(response.body)
      return self
    }).catch(function () {
      console.log('COULD NOT FIND: ' + self.entry)
      return Promise.reject(null)
    })
  }
}

/**
 * Get album popularity.
 * @return {Promise | integer} The track popularity.
 */
Album.prototype.getPopularity = function () {
  var self = this
  if (Number.isInteger(this.popularity)) {
    return Promise.resolve(this.popularity)
  } else {
    return self.getAlbum().then(function () {
      return self.popularity
    })
  }
}

/**
 * Get album tracks.
 * @return {Promise | Album} Itself.
 */
Album.prototype.getTracks = function () {
  var self = this
  if (this.tracks) {
    return Promise.resolve(this)
  } else if (this.id) {
    return self.getAlbum()
  } else {
    return this.searchAlbums().then(function () {
      return self.getAlbum()
    })
  }
}

/**
 * Search for album if not known.
 * @param {string} [album] - The album.
 * @param {string} [artist] - The album artist.
 * @return {Promise | JSON} A JSON response, or `null` if not found.
 */
Album.prototype.searchAlbums = function (album, artist) {
  var self = this

  // helper functions
  function search (album, artist) {
    var query = album.trim()
    if (artist) {
      query = 'album:"' + album.trim() + '"'
      query += ' artist:"' + artist.trim() + '"'
    }
    return self.spotify.searchAlbums(query).then(function (response) {
      if (response &&
          response.body &&
          response.body.albums &&
          response.body.albums.items &&
          response.body.albums.items[0]) {
        // sort results by string similarity
        if (!artist) {
          sort(response.body.albums.items, sort.similarAlbum(query))
        }
        response = response.body.albums.items[0]
        self.clone(response)
        return Promise.resolve(self)
      } else {
        console.log('COULD NOT FIND: ' + self.entry)
        return Promise.reject(response)
      }
    })
  }

  function searchAlbumArtist (album, artist) {
    return search(album, artist).catch(function () {
      // swap album and artist and try again
      return search(artist, album)
    })
  }

  function searchQuery (query) {
    return search(query).catch(function () {
      // try again with simplified search query
      var str = util.toAscii(util.stripNoise(query))
      if (str && str !== query) {
        return search(str)
      } else {
        return Promise.reject(null)
      }
    }).catch(function () {
      // try again as ID
      if (query.match(/^[0-9a-z]+$/i)) {
        return self.getAlbum(query)
      } else {
        console.log('COULD NOT FIND: ' + self.entry)
        return Promise.reject(null)
      }
    })
  }

  // search parameters
  album = album || this.entry
  artist = artist || this.artist

  // perform search
  if (this.id) {
    return Promise.resolve(this)
  } else if (artist) {
    album = this.name
    return searchAlbumArtist(album, artist).catch(function () {
      return searchQuery(artist + ' - ' + album)
    })
  } else {
    return searchQuery(album)
  }
}

module.exports = Album
