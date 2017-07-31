var defaults = require('./defaults')
var lastfm = require('./lastfm')(defaults.api)
var SpotifyRequestHandler = require('./spotify')

/**
 * Create track entry.
 * @constructor
 * @param {SpotifyRequestHandler} spotify - Spotify request handler.
 * @param {string} entry - The track to search for.
 * @param {string} [id] - The Spotify ID, if known.
 */
function Track (spotify, entry, id) {
  /**
   * Album name.
   */
  this.album = ''

  /**
   * Track artists, separated by `,`.
   */
  this.artist = ''

  /**
   * Array of track artists.
   */
  this.artists = []

  /**
   * Entry string.
   */
  this.entry = ''

  /**
   * Spotify ID.
   */
  this.id = ''

  /**
   * Last.fm global playcount.
   */
  this.lastfm = ''

  /**
   * Last.fm global playcount.
   */
  this.lastfmGlobal = ''

  /**
   * Last.fm personal playcount.
   */
  this.lastfmPersonal = ''

  /**
   * Main track artist.
   */
  this.mainArtist = ''

  /**
   * Track name.
   */
  this.name = ''

  /**
   * Spotify popularity.
   */
  this.popularity = ''

  /**
   * Spotify request handler.
   */
  this.spotify = null

  /**
   * Full track name on the form `Artist - Title`.
   */
  this.title = ''

  /**
   * Spotify URI
   * (a string on the form `spotify:track:xxxxxxxxxxxxxxxxxxxxxx`).
   */
  this.uri = ''

  this.entry = entry.trim()
  this.id = id
  this.name = entry
  this.spotify = spotify || new SpotifyRequestHandler()
  this.uri = this.id ? ('spotify:track:' + this.id) : this.uri
}

/**
 * Clone a JSON response.
 * @param {Object} response - The response.
 */
Track.prototype.clone = function (response) {
  for (var prop in response) {
    if (response.hasOwnProperty(prop)) {
      this[prop] = response[prop] || this[prop]
    }
  }
  if (response.album &&
      response.album.name) {
    this.album = response.album.name
  }
  if (response.artists) {
    this.artists = response.artists.map(function (artist) {
      return artist.name.trim()
    })
    this.artist = this.artists.join(', ')
    this.mainArtist = this.artists[0]
  }
  if (this.mainArtist && this.name) {
    this.title = this.mainArtist + ' - ' + this.name
  } else {
    this.title = this.name
  }
}

/**
 * Dispatch entry.
 * @return {Promise | Track} Itself.
 */
Track.prototype.dispatch = function () {
  if (this.popularity) {
    return Promise.resolve(this)
  } else if (this.id) {
    return this.fetchTrack()
  } else {
    return this.searchForTrack()
  }
}

/**
 * Whether this track is equal to another track.
 * @param {Track} track - The track to compare against.
 * @return {boolean} `true` if the tracks are equal,
 * `false` otherwise.
 */
Track.prototype.equals = function (track) {
  return this.uri && track.uri && this.uri === track.uri
}

/**
 * Fetch Last.fm information.
 * @return {Promise | Track} Itself.
 */
Track.prototype.fetchLastfm = function (user) {
  var self = this
  return lastfm.getInfo(this.artist, this.name, user).then(function (result) {
    self.lastfmGlobal = parseInt(result.track.playcount)
    self.lastfmPersonal = parseInt(result.track.userplaycount)
    self.lastfm = self.lastfmPersonal > -1 ? self.lastfmPersonal : self.lastfmGlobal
    return self
  })
}

/**
 * Fetch track metadata.
 * @return {Promise | Track} Itself.
 */
Track.prototype.fetchTrack = function (id) {
  id = id || this.id
  var self = this
  if (Number.isInteger(this.popularity)) {
    return Promise.resolve(this)
  } else {
    return this.spotify.getTrack(id).then(function (response) {
      self.clone(response)
      return self
    })
  }
}

/**
 * Get track popularity.
 * @return {Promise | integer} The track popularity.
 */
Track.prototype.getPopularity = function () {
  var self = this
  if (Number.isInteger(this.popularity)) {
    return Promise.resolve(this.popularity)
  } else {
    return self.refresh().then(function () {
      return self.popularity
    })
  }
}

/**
 * Whether the track has the given artist.
 * @param {string} artist - The artist.
 * @return {boolean} `true` the track has the artist,
 * `false` otherwise.
 */
Track.prototype.hasArtist = function (artist) {
  artist = artist.trim().toLowerCase()
  for (var i in this.artists) {
    var trackArtist = this.artists[i].toLowerCase().trim()
    if (trackArtist.includes(artist)) {
      return true
    }
  }
  return false
}

/**
 * Refresh track metadata.
 * @return {Promise | Track} Itself.
 */
Track.prototype.refresh = function () {
  var self = this
  return self.dispatch().then(function () {
    return self.dispatch()
  })
}

/**
 * Search for track.
 * @param {string} query - The query text.
 * @return {Promise | Track} Itself.
 */
Track.prototype.searchForTrack = function () {
  var self = this
  return this.spotify.searchForTrack(this.entry).then(function (response) {
    if (response &&
        response.tracks &&
        response.tracks.items &&
        response.tracks.items[0]) {
      response = response.tracks.items[0]
      self.clone(response)
      return Promise.resolve(self)
    } else {
      return Promise.reject(response)
    }
  }).catch(function () {
    if (self.entry.match(/^[0-9a-z]+$/i)) {
      return self.fetchTrack(self.entry)
    } else {
      // console.log('COULD NOT FIND ' + self.entry)
      return Promise.reject(null)
    }
  })
}

/**
 * Whether this track is similar to another track.
 * @param {Track} track - The track to compare against.
 * @return {boolean} `true` if the tracks are similar,
 * `false` otherwise.
 */
Track.prototype.similarTo = function (track) {
  return this.equals(track) ||
    this.title.toLowerCase() === track.title.toLowerCase()
}

/**
 * Full track title.
 * @return {string} The track title.
 */
Track.prototype.toString = function () {
  return this.title || this.name || this.entry || this.id
}

module.exports = Track
