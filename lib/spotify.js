var request = require('request')
var spotify = {}

/**
 * Fetch album metadata.
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
  return getAlbums(url, null)
}

/**
 * Get the top tracks of an artist.
 * @param {string} id - Artist ID.
 * @return {Promise | JSON} A JSON response.
 */
spotify.getTopTracks = function (id) {
  var url = 'https://api.spotify.com/v1/artists/'
  url += encodeURIComponent(id) + '/top-tracks?country=US'
  return spotify.request(url).then(function (response) {
    if (response &&
        response.tracks) {
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

/**
 * Get a track.
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
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log(url)
      request(url, function (err, response, body) {
        if (err) {
          reject(err)
        } else if (response.statusCode !== 200) {
          reject(response.statusCode)
        } else {
          try {
            // TODO: replace with request-json
            body = JSON.parse(body)
          } catch (e) {
            reject(e)
          }
          if (body.error) {
            reject(body)
          } else {
            resolve(body)
          }
        }
      })
    }, 100)
  })
}

/**
 * Search for artist.
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
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

/**
 * Search for album.
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
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

/**
 * Search for related artists.
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
 * @param {string} track - The track to search for.
 * @return {Promise | JSON} JSON response.
 */
spotify.searchForTrack = function (track) {
  var url = 'https://api.spotify.com/v1/search?type=track&q='
  url += encodeURIComponent(track)
  return spotify.request(url).then(function (response) {
    if (response.tracks &&
        response.tracks.items[0] &&
        response.tracks.items[0].uri) {
      return Promise.resolve(response)
    } else {
      return Promise.reject(response)
    }
  })
}

module.exports = spotify
