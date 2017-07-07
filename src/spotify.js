var base64 = require('base-64')
var defaults = require('./defaults')
var http = require('./http')
var sort = require('./sort')

/**
 * Create a Spotify request handler.
 * @constructor
 * @param {string} [clientId] - Client ID.
 * @param {string} [clientSecret] - Client secret key.
 * @param {string} [token] - Access token (if already authenticated).
 */
function SpotifyRequestHandler (clientId, clientSecret, token) {
  /**
   * Client ID.
   */
  this.clientId = clientId || defaults.id

  /**
   * Client secret key.
   */
  this.clientSecret = clientSecret || defaults.key

  /**
   * Access token.
   */
  this.token = token || ''
}

/**
 * Authenticate with the Clients Credentials Flow.
 *
 * Note: this authentication method only works if the script is run
 * from the command line. It does not work when run from a browser,
 * because Spotify's authentication server rejects cross-site
 * requests. In that case, authenticate with the Implicit Grant Flow
 * instead and pass the access token to this class via the `token`
 * constructor parameter.
 *
 * [Reference](https://developer.spotify.com/web-api/authorization-guide/#client-credentials-flow).
 *
 * @param {string} clientId - Client ID.
 * @param {string} clientSecret - Client secret key.
 * @param {string} [grantType] - Grant type, default "client_credentials".
 * @return {Promise | JSON} An access token response.
 */
SpotifyRequestHandler.prototype.clientsCredentialsFlow = function (clientId, clientSecret, grantType) {
  clientId = clientId || this.clientId
  clientSecret = clientSecret || this.clientSecret
  grantType = grantType || 'client_credentials'
  var auth = 'Basic ' + base64.encode(clientId + ':' + clientSecret)
  var uri = 'https://accounts.spotify.com/api/token'
  return http.json(uri, {
    'method': 'POST',
    'headers': {
      'Authorization': auth
    },
    'form': {
      'grant_type': grantType
    }
  })
}

/**
 * Authenticate with Implicit Grant Flow.
 *
 * [Reference](https://developer.spotify.com/web-api/authorization-guide/#implicit-grant-flow).
 *
 * @param {string} uri - Redirect URI.
 * @param {string} [clientId] - Client ID.
 * @return {string} An authentication URI.
 */
SpotifyRequestHandler.prototype.implicitGrantFlow = function (uri, clientId) {
  clientId = clientId || this.clientId
  var url = 'https://accounts.spotify.com/authorize'
  url += '/' +
    '?client_id=' + encodeURIComponent(clientId) +
    '&response_type=' + encodeURIComponent('token') +
    '&redirect_uri=' + encodeURIComponent(uri)
  return url
}

/**
 * Refresh the bearer access token.
 *
 * @return {Promise | string} A new bearer access token,
 * or the empty string if not available.
 */
SpotifyRequestHandler.prototype.refreshToken = function () {
  return this.clientsCredentialsFlow().then(function (response) {
    if (response &&
        response.access_token) {
      this.token = response.access_token
    }
    return this.token
  })
}

/**
 * Obtain a bearer access token.
 *
 * @return {Promise | string} A bearer access token,
 * or the empty string if not available.
 */
SpotifyRequestHandler.prototype.getToken = function () {
  if (this.token) {
    return Promise.resolve(this.token)
  } else {
    return this.refreshToken()
  }
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
SpotifyRequestHandler.prototype.getAlbumsByArtist = function (id) {
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
 * Get the top tracks of an artist.
 *
 * [Reference](https://developer.spotify.com/web-api/get-artists-top-tracks/#example).
 *
 * @param {string} id - Artist ID.
 * @return {Promise | JSON} A JSON response.
 */
SpotifyRequestHandler.prototype.getTopTracks = function (id) {
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
  return this.getToken().then(function (token) {
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
SpotifyRequestHandler.prototype.searchForArtist = function (artist) {
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
 * @return {Promise | JSON} A JSON response.
 */
SpotifyRequestHandler.prototype.searchForAlbum = function (album) {
  var uri = 'https://api.spotify.com/v1/search?type=album&q='
  uri += encodeURIComponent(album)
  return this.request(uri).then(function (response) {
    if (response &&
        response.albums &&
        response.albums.items[0] &&
        response.albums.items[0].id) {
      // sort results by string similarity
      sort(response.albums.items, sort.similarAlbum(album))
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
SpotifyRequestHandler.prototype.searchForRelatedArtists = function (id) {
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
 * @return {Promise | JSON} JSON response.
 */
SpotifyRequestHandler.prototype.searchForTrack = function (track) {
  var uri = 'https://api.spotify.com/v1/search?type=track&limit=50&q='
  uri += encodeURIComponent(track)
  return this.request(uri).then(function (response) {
    if (response.tracks &&
        response.tracks.items[0] &&
        response.tracks.items[0].uri) {
      // Sort results by string similarity. This takes care of some
      // odd cases where a random track from an album of the same name
      // is returned as the first hit.
      sort(response.tracks.items, sort.track(track))
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

module.exports = SpotifyRequestHandler
