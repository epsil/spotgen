var base64 = require('base-64')
var defaults = require('./defaults')
var http = require('./http')
var sort = require('./sort')
var spotify = {}

var token = ''

/**
 * Authenticate with Clients Credentials Flow.
 *
 * [Reference](https://developer.spotify.com/web-api/authorization-guide/#client-credentials-flow).
 *
 * @param {string} clientId - Client ID.
 * @param {string} clientSecret - Client secret key.
 * @param {string} [grantType] - Grant type, default "client_credentials".
 * @return {Promise | string} An access token response.
 */
spotify.auth = function (clientId, clientSecret, grantType) {
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
 * Refresh the bearer access token.
 *
 * @return {Promise | string} A new bearer access token.
 */
spotify.refreshToken = function () {
  return spotify.auth(defaults.id, defaults.key).then(function (response) {
    if (response && response.access_token) {
      token = response.access_token
    }
    return token
  })
}

/**
 * Obtain a bearer access token.
 *
 * @return {Promise | string} A bearer access token.
 */
spotify.getToken = function () {
  if (token !== '') {
    return Promise.resolve(token)
  } else {
    return spotify.refreshToken()
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
spotify.getAlbum = function (id) {
  var uri = 'https://api.spotify.com/v1/albums/'
  uri += encodeURIComponent(id)
  return spotify.request(uri).then(function (response) {
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
spotify.getAlbumsByArtist = function (id) {
  var uri = 'https://api.spotify.com/v1/artists/'
  uri += encodeURIComponent(id) + '/albums?limit=50'

  var getAlbums = function (uri, result) {
    return spotify.request(uri).then(function (response) {
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
  var sortAlbums = function (response) {
    if (response && response.items) {
      response.items = sort(response.items, sort.album)
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
spotify.getTopTracks = function (id) {
  var uri = 'https://api.spotify.com/v1/artists/'
  uri += encodeURIComponent(id) + '/top-tracks?country=US'
  return spotify.request(uri).then(function (response) {
    if (response &&
        response.tracks) {
      response.tracks = sort(response.tracks, sort.popularity)
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
spotify.getTrack = function (id) {
  var uri = 'https://api.spotify.com/v1/tracks/'
  uri += encodeURIComponent(id)
  return spotify.request(uri)
}

/**
 * Perform a Spotify request.
 * @param {string} uri - The URI to resolve.
 * @param {Object} [options] - Request options.
 * @return {Promise | JSON} A JSON response.
 */
spotify.request = function (uri, options) {
  options = options || {}
  console.log(uri)
  return spotify.getToken().then(function (token) {
    options.headers = options.headers || {}
    options.headers.Authorization = 'Bearer ' + token
    return http.json(uri, options)
  }).catch(function (status) {
    return spotify.refreshToken().then(function (token) {
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
spotify.searchForArtist = function (artist) {
  var uri = 'https://api.spotify.com/v1/search?type=artist&q='
  uri += encodeURIComponent(artist)
  return spotify.request(uri).then(function (response) {
    if (response &&
        response.artists &&
        response.artists.items[0] &&
        response.artists.items[0].id) {
      // sort results by string similarity
      response.artists.items = sort(response.artists.items,
                                    sort.similarArtist(artist))
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
spotify.searchForAlbum = function (album) {
  var uri = 'https://api.spotify.com/v1/search?type=album&q='
  uri += encodeURIComponent(album)
  return spotify.request(uri).then(function (response) {
    if (response &&
        response.albums &&
        response.albums.items[0] &&
        response.albums.items[0].id) {
      // sort results by string similarity
      response.albums.items = sort(response.albums.items,
                                   sort.similarAlbum(album))
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
spotify.searchForRelatedArtists = function (id) {
  var uri = 'https://api.spotify.com/v1/artists/'
  uri += encodeURIComponent(id) + '/related-artists'
  return spotify.request(uri).then(function (response) {
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
spotify.searchForTrack = function (track) {
  var uri = 'https://api.spotify.com/v1/search?type=track&limit=50&q='
  uri += encodeURIComponent(track)
  return spotify.request(uri).then(function (response) {
    if (response.tracks &&
        response.tracks.items[0] &&
        response.tracks.items[0].uri) {
      // Sort results by string similarity. This takes care of some
      // odd cases where a random track from an album of the same name
      // is returned as the first hit.
      response.tracks.items = sort(response.tracks.items,
                                   sort.track(track))
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

module.exports = spotify
