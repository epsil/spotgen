var csvStringify = require('csv-stringify/lib/sync')
var defaults = require('./defaults')
var lastfm = require('./lastfm')(defaults.api)
var sort = require('./sort')
var util = require('./util')

/**
 * Create track entry.
 * @constructor
 * @param {SpotifyWebApi} spotify - Spotify web API.
 * @param {string} entry - The track to search for.
 * @param {string} [id] - The Spotify ID, if known.
 */
function Track (spotify, entry, artist, name, album, id) {
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
  this.artists = null

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
  this.lastfm = null

  /**
   * Last.fm global playcount.
   */
  this.lastfmGlobal = null

  /**
   * Last.fm personal playcount.
   */
  this.lastfmPersonal = null

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
  this.popularity = null

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
  this.name = name
  this.artist = artist
  this.album = album
  this.id = id
  this.spotify = spotify
}

/**
 * Clone a JSON response.
 * @param {Object} response - The response.
 */
Track.prototype.clone = function (response) {
  for (var prop in response) {
    if (response.hasOwnProperty(prop)) {
      this[prop] = response[prop]
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
 * Track data in CSV format, with the following fields:
 *
 * Spotify URI,
 * Track Name,
 * Artist Name,
 * Album Name,
 * Disc Number,
 * Track Number,
 * Track Duration,
 * Spotify popularity,
 * Last.fm rating
 *
 * @return {string} Track data in CSV format.
 */
Track.prototype.csv = function () {
  function numberToString (num) {
    return (Number.isInteger(num) && (num >= 0)) ? num : ''
  }
  return csvStringify([[
    this.uri,
    this.name,
    this.artist,
    this.album,
    numberToString(this.disc_number),
    numberToString(this.track_number),
    numberToString(this.duration_ms),
    numberToString(this.popularity),
    numberToString(this.lastfm)
  ]]).trim()
}

/**
 * Dispatch entry.
 * @return {Promise | Track} Itself.
 */
Track.prototype.dispatch = function () {
  var self = this
  return this.getURI().then(function () {
    return self
  })
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
 * Get track audio features.
 *
 * [Reference](https://developer.spotify.com/web-api/get-audio-features/).
 *
 * @return {Promise | Track} Itself.
 */
Track.prototype.getAudioFeaturesForTrack = function (id) {
  id = id || this.id
  var self = this
  if (this.tempo) {
    return Promise.resolve(this)
  } else {
    return this.spotify.getAudioFeaturesForTrack(id).then(function (response) {
      self.clone(response.body)
      // define aliases
      self.unacousticness = 1.0 - (self.acousticness || 0.0)
      self.undanceability = 1.0 - (self.danceability || 0.0)
      self.unenergy = 1.0 - (self.energy || 0.0)
      self.uninstrumentalness = 1.0 - (self.instrumentalness || 0.0)
      self.unliveness = 1.0 - (self.liveness || 0.0)
      self.unloudness = 1.0 - (self.loudness || 0.0)
      self.unspeechiness = 1.0 - (self.speechiness || 0.0)
      self.unvalence = 1.0 - (self.valence || 0.0)
      return self
    })
  }
}

/**
 * Fetch Last.fm information.
 * @return {Promise | Track} Itself.
 */
Track.prototype.getLastfm = function (user) {
  var self = this
  return this.getProperty('artist').then(function () {
    return self.getProperty('name')
  }).then(function () {
    return lastfm.getInfo(self.artist, self.name, user).then(function (result) {
      self.lastfmGlobal = parseInt(result.track.playcount)
      self.lastfmPersonal = parseInt(result.track.userplaycount)
      self.lastfm = self.lastfmPersonal > -1 ? self.lastfmPersonal : self.lastfmGlobal
      return self
    })
  })
}

/**
 * Get track popularity.
 * @return {Promise | integer} The track popularity.
 */
Track.prototype.getPopularity = function () {
  return this.getProperty('popularity')
}

/**
 * Get a track property.
 *
 * If the requested property is not set, this function fetches
 * the missing information from Spotify's web API.
 *
 * @param {string} prop - The property to get.
 * @return {Promise | Object} A value.
 */
Track.prototype.getProperty = function (prop) {
  var self = this
  function fetchProperty (prop) {
    if (self[prop]) {
      return Promise.resolve(self[prop])
    } else if (prop === 'lastfm' ||
               prop === 'lastfmGlobal' ||
               prop === 'lastfmPersonal') {
      return self.getLastfm()
    } else if (prop === 'danceability' ||
               prop === 'energy' ||
               prop === 'key' ||
               prop === 'loudness' ||
               prop === 'mode' ||
               prop === 'speechiness' ||
               prop === 'acousticness' ||
               prop === 'instrumentalness' ||
               prop === 'liveness' ||
               prop === 'valence' ||
               prop === 'tempo' ||
               prop === 'time_signature' ||
               prop === 'unacousticness' ||
               prop === 'undanceability' ||
               prop === 'unenergy' ||
               prop === 'uninstrumentalness' ||
               prop === 'unliveness' ||
               prop === 'unloudness' ||
               prop === 'unspeechiness' ||
               prop === 'unvalence') {
      return self.getProperty('id').then(function () {
        return self.getAudioFeaturesForTrack()
      })
    } else if (prop === 'popularity') {
      return self.getProperty('id').then(function () {
        return self.getTrack()
      })
    } else if (prop === 'artist' ||
               prop === 'name' ||
               prop === 'album') {
      if (self.id) {
        return self.getTrack()
      } else {
        return self.searchTracks()
      }
    } else if (prop === 'uri') {
      if (self.id) {
        self.uri = 'spotify:track:' + self.id
      } else {
        return self.searchTracks()
      }
    } else if (prop === 'id') {
      return self.searchTracks()
    }
    return Promise.resolve(self[prop])
  }
  return fetchProperty(prop).then(function () {
    return self[prop]
  })
}

/**
 * Fetch track metadata.
 * @return {Promise | Track} Itself.
 */
Track.prototype.getTrack = function (id) {
  id = id || this.id
  var self = this
  if (Number.isInteger(this.popularity)) {
    return Promise.resolve(this)
  } else {
    return this.spotify.getTrack(id).then(function (response) {
      self.clone(response.body)
      return self
    }).catch(function () {
      console.log('COULD NOT FIND: ' + self.entry)
      return Promise.reject(null)
    })
  }
}

/**
 * Get track URI.
 * @return {Promise | Track} Itself.
 */
Track.prototype.getURI = function () {
  return this.getProperty('uri')
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
 * Search for track.
 * @param {string} [track] - The track.
 * @param {string} [artist] - The track artist.
 * @param {string} [album] - The track album.
 * @return {Promise | Track} Itself.
 */
Track.prototype.searchTracks = function (track, artist, album) {
  var self = this

  // helper functions
  function search (track, artist, album) {
    var query = track.trim()
    if (artist || album) {
      query = 'track:"' + track.trim() + '"'
      query += artist ? (' artist:"' + artist.trim() + '"') : ''
      query += album ? (' album:"' + album.trim() + '"') : ''
    }
    return self.spotify.searchTracks(query).then(function (response) {
      if (response &&
          response.body &&
          response.body.tracks &&
          response.body.tracks.items &&
          response.body.tracks.items[0]) {
        // Sort results by string similarity. This takes care of some
        // odd cases where a random track from an album of the same name
        // is returned as the first hit.
        if (!artist) {
          sort(response.body.tracks.items, sort.track(query))
        }
        response = response.body.tracks.items[0]
        self.clone(response)
        return Promise.resolve(self)
      } else {
        console.log('COULD NOT FIND: ' + self.entry)
        return Promise.reject(response)
      }
    })
  }

  function searchTrackArtist (title, artist, album) {
    return search(track, artist, album).catch(function () {
      // swap artist and title and try again
      return search(artist, track, album)
    })
  }

  function searchTrackArtistAlbum (title, artist, album) {
    return searchTrackArtist(track, artist, album).catch(function () {
      if (album) {
        // try again without artist
        return searchTrackArtist(track, artist)
      } else {
        return Promise.reject(null)
      }
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
        return self.getTrack(query)
      } else {
        console.log('COULD NOT FIND: ' + self.entry)
        return Promise.reject(null)
      }
    })
  }

  // search parameters
  track = track || this.entry
  artist = this.artist
  album = this.album

  // perform search
  if (this.id) {
    return Promise.resolve(this)
  } else if (artist) {
    track = this.name
    return searchTrackArtistAlbum(track, artist, album).catch(function () {
      return searchQuery((artist ? (artist + ' - ') : '') +
                         track +
                         (album ? (' - ' + album) : ''))
    })
  } else {
    return searchQuery(track)
  }
}

/**
 * Whether this track is similar to another track.
 * @param {Track} track - The track to compare against.
 * @return {boolean} `true` if the tracks are similar,
 * `false` otherwise.
 */
Track.prototype.similarTo = function (track) {
  function trim (str) {
    str = util.toAscii(str)
    str = util.stripPunctuation(str)
    str = util.stripWhitespace(str)
    str = str.toLowerCase()
    return str
  }
  return this.equals(track) ||
    (this.title && track.title &&
     (this.title === track.title ||
      (trim(this.title) !== '' &&
       trim(this.title) === trim(track.title))))
}

/**
 * Full track title.
 * @return {string} The track title.
 */
Track.prototype.toString = function () {
  return this.title || this.name || this.entry || this.id
}

module.exports = Track
