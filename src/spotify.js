var http = require('./http')
var sort = require('./sort')
var spotify = {}

/**
 * Fetch album metadata.
 *
 * [Reference](https://developer.spotify.com/web-api/get-album/#example).
 *
 * @param {string} id - Album ID.
 * @return {Promise | JSON} A JSON response.
 */
spotify.getAlbum = function (id) {
  var url = 'https://api.spotify.com/v1/albums/'
  url += encodeURIComponent(id)
  return spotify.request(url).then(function (response) {
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
  var url = 'https://api.spotify.com/v1/artists/'
  url += encodeURIComponent(id) + '/albums?limit=50'

  var getAlbums = function (url, result) {
    return spotify.request(url).then(function (response) {
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

  return getAlbums(url).then(sortAlbums)
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
  var url = 'https://api.spotify.com/v1/artists/'
  url += encodeURIComponent(id) + '/top-tracks?country=US'
  return spotify.request(url).then(function (response) {
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
  var url = 'https://api.spotify.com/v1/tracks/'
  url += encodeURIComponent(id)
  return spotify.request(url)
}

/**
 * Perform a Spotify request.
 * @param {string} url - The URL to resolve.
 * @return {Promise | JSON} A JSON response.
 */
spotify.request = function (url) {
  console.log(url)
  return http.json(url)
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
  var url = 'https://api.spotify.com/v1/search?type=artist&q='
  url += encodeURIComponent(artist)
  return spotify.request(url).then(function (response) {
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
  var url = 'https://api.spotify.com/v1/search?type=album&q='
  url += encodeURIComponent(album)
  return spotify.request(url).then(function (response) {
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
  var url = 'https://api.spotify.com/v1/artists/'
  url += encodeURIComponent(id) + '/related-artists'
  return spotify.request(url).then(function (response) {
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
  var url = 'https://api.spotify.com/v1/search?type=track&limit=50&q='
  url += encodeURIComponent(track)
  return spotify.request(url).then(function (response) {
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
