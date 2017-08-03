var http = require('./http')
var sort = require('./sort')
var SpotifyAuthenticator = require('./auth')

/**
 * Create a Spotify request handler.
 * @constructor
 * @param {string} [clientId] - Client ID.
 * @param {string} [clientKey] - Client secret key.
 * @param {string} [token] - Access token (if already authenticated).
 */
function SpotifyRequestHandler (clientId, clientKey, token) {
  /**
   * Spotify authenticator.
   */
  this.auth = new SpotifyAuthenticator(clientId, clientKey, token)
}

/**
 * Fetch album metadata.
 *
 * [Reference](https://developer.spotify.com/web-api/get-album/#example).
 *
 * @param {string} id - Album ID.
 * @return {Promise | JSON} A JSON response.
 */
SpotifyRequestHandler.prototype.getAlbum = function (id) {
  var uri = 'https://api.spotify.com/v1/albums/'
  uri += encodeURIComponent(id)
  return this.request(uri).then(function (response) {
    if (response &&
        response.id) {
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

/**
 * Get all albums by an artist.
 *
 * [Reference](https://developer.spotify.com/web-api/get-artists-albums/#example).
 *
 * @param {string} id - Artist ID.
 * @return {Promise | JSON} A JSON response.
 */
SpotifyRequestHandler.prototype.getArtistAlbums = function (id) {
  var self = this
  var uri = 'https://api.spotify.com/v1/artists/'
  uri += encodeURIComponent(id) + '/albums?limit=50'

  function getAlbums (uri, result) {
    return self.request(uri).then(function (response) {
      if (!(response &&
            response.items)) {
        return Promise.reject(response)
      }
      if (result) {
        result.items = result.items.concat(response.items)
      } else {
        result = response
      }
      if (response.next) {
        return getAlbums(response.next, result)
      } else {
        return Promise.resolve(result)
      }
    })
  }

  // sort albums by type
  function sortAlbums (response) {
    if (response && response.items) {
      sort(response.items, sort.album)
    }
    return response
  }

  return getAlbums(uri).then(sortAlbums)
}

/**
 * Fetch a playlist's tracks.
 *
 * @param {string} [id] - The playlist ID.
 * @param {string} [owner] - The owner ID.
 *
 * [Reference](https://developer.spotify.com/web-api/get-playlists-tracks/#example).
 *
 * @param {string} id - Album ID.
 * @return {Promise | JSON} A JSON response.
 */
SpotifyRequestHandler.prototype.getPlaylist = function (owner, id) {
  var self = this
  var uri = 'https://api.spotify.com/v1/users/' +
      encodeURIComponent(owner) +
      '/playlists/' +
      encodeURIComponent(id) +
      '/tracks'
  function getTracks (uri, result) {
    return self.request(uri).then(function (response) {
      if (!(response &&
            response.items)) {
        return Promise.reject(response)
      }
      if (result) {
        result.items = result.items.concat(response.items)
      } else {
        result = response
      }
      if (response.next) {
        return getTracks(response.next, result)
      } else {
        return Promise.resolve(result)
      }
    })
  }
  return getTracks(uri)
}

/**
 * Get the top tracks of an artist.
 *
 * [Reference](https://developer.spotify.com/web-api/get-artists-top-tracks/#example).
 *
 * @param {string} id - Artist ID.
 * @return {Promise | JSON} A JSON response.
 */
SpotifyRequestHandler.prototype.getArtistTopTracks = function (id) {
  var uri = 'https://api.spotify.com/v1/artists/'
  uri += encodeURIComponent(id) + '/top-tracks?country=US'
  return this.request(uri).then(function (response) {
    if (response &&
        response.tracks) {
      sort(response.tracks, sort.popularity)
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

/**
 * Get a track.
 *
 * [Reference](https://developer.spotify.com/web-api/get-track/#example).
 *
 * @param {string} id - Track ID.
 * @return {Promise | JSON} A JSON response.
 */
SpotifyRequestHandler.prototype.getTrack = function (id) {
  var uri = 'https://api.spotify.com/v1/tracks/'
  uri += encodeURIComponent(id)
  return this.request(uri)
}

/**
 * Perform a Spotify request.
 * @param {string} uri - The URI to resolve.
 * @param {Object} [options] - Request options.
 * @return {Promise | JSON} A JSON response.
 */
SpotifyRequestHandler.prototype.request = function (uri, options) {
  var self = this
  options = options || {}
  console.log(uri)
  return this.auth.getToken().then(function (token) {
    options.headers = options.headers || {}
    options.headers.Authorization = 'Bearer ' + token
    return http.json(uri, options)
  }).catch(function (status) {
    return self.refreshToken().then(function (token) {
      options.headers.Authorization = 'Bearer ' + token
      return http.json(uri, options)
    })
  })
}

/**
 * Search for artist.
 *
 * [Reference](https://developer.spotify.com/web-api/search-item/#example).
 *
 * @param {string} artist - The artist to search for.
 * @return {Promise | JSON} A JSON response.
 */
SpotifyRequestHandler.prototype.searchArtists = function (artist) {
  var uri = 'https://api.spotify.com/v1/search?type=artist&q='
  uri += encodeURIComponent(artist)
  return this.request(uri).then(function (response) {
    if (response &&
        response.artists &&
        response.artists.items[0] &&
        response.artists.items[0].id) {
      // sort results by string similarity
      sort(response.artists.items, sort.similarArtist(artist))
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

/**
 * Search for album.
 *
 * [Reference](https://developer.spotify.com/web-api/search-item/#example).
 *
 * @param {string} album - The album to search for.
 * @param {string} [artist] - The album artist.
 * @return {Promise | JSON} A JSON response.
 */
SpotifyRequestHandler.prototype.searchAlbums = function (album, artist) {
  var query = album
  if (artist) {
    query = 'album:"' + album + '"'
    query += artist ? (' artist:"' + artist + '"') : ''
  }
  var uri = 'https://api.spotify.com/v1/search?type=album&q='
  uri += encodeURIComponent(query)
  return this.request(uri).then(function (response) {
    if (response &&
        response.albums &&
        response.albums.items[0] &&
        response.albums.items[0].id) {
      // sort results by string similarity
      if (!artist) {
        sort(response.albums.items, sort.similarAlbum(album))
      }
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

/**
 * Search for playlist.
 *
 * @param {string} playlist - The playlist to search for.

 * [Reference](https://developer.spotify.com/web-api/search-item/#example).
 *
 * @param {string} playlist - The track to search for.
 * @return {Promise | JSON} JSON response.
 */
SpotifyRequestHandler.prototype.searchPlaylists = function (playlist) {
  var uri = 'https://api.spotify.com/v1/search?type=playlist&limit=50&q='
  uri += encodeURIComponent(playlist)
  return this.request(uri).then(function (response) {
    if (response.playlists &&
        response.playlists.items[0] &&
        response.playlists.items[0].uri) {
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

/**
 * Search for related artists.
 *
 * [Reference](https://developer.spotify.com/web-api/get-related-artists/#example).
 *
 * @param {string} id - The album ID.
 * @return {Promise | JSON} A JSON response.
 */
SpotifyRequestHandler.prototype.getArtistRelatedArtists = function (id) {
  var uri = 'https://api.spotify.com/v1/artists/'
  uri += encodeURIComponent(id) + '/related-artists'
  return this.request(uri).then(function (response) {
    if (response &&
        response.artists) {
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

/**
 * Search for track.
 *
 * [Reference](https://developer.spotify.com/web-api/search-item/#example).
 *
 * @param {string} track - The track to search for.
 * @param {string} [artist] - The track artist.
 * @param {string} [album] - The track album.
 * @return {Promise | JSON} JSON response.
 */
SpotifyRequestHandler.prototype.searchTracks = function (track, artist, album) {
  var query = track
  if (artist || album) {
    query = 'track:"' + track + '"'
    query += artist ? (' artist:"' + artist + '"') : ''
    query += album ? (' album:"' + album + '"') : ''
  }
  var uri = 'https://api.spotify.com/v1/search?type=track&limit=50&q='
  uri += encodeURIComponent(query)
  return this.request(uri).then(function (response) {
    if (response.tracks &&
        response.tracks.items[0] &&
        response.tracks.items[0].uri) {
      // Sort results by string similarity. This takes care of some
      // odd cases where a random track from an album of the same name
      // is returned as the first hit.
      if (!(album && artist)) {
        sort(response.tracks.items, sort.track(track))
      }
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

module.exports = SpotifyRequestHandler
