#!/usr/bin/env node

/* eslint-disable no-unused-vars */
var async = require('async')
var fs = require('fs')
var request = require('request')

var input = process.argv[2] || 'input.txt'
var output = process.argv[3] || 'output.txt'

var spotify = {}

spotify.readList = function (file) {
  return fs.readFileSync(file, 'utf8').toString().split(/\r|\n|\r\n/)
}

spotify.request = function (url) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      request(url, function (err, response, body) {
        if (err) {
          reject(err)
        } else if (response.statusCode !== 200) {
          reject(response.statusCode)
        } else {
          try {
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
 * Album query.
 * @constructor
 * @param {string} query - The album to search for.
 */
spotify.Album = function (query) {
  /**
   * Self reference.
   */
  var self = this

  if (typeof query === 'string') {
    this.query = query.trim()
  }

  this.dispatch = function () {
    if (this.searchResponse) {
      return this.fetchAlbum(this.searchResponse)
                 .then(this.createCollection)
    } else if (this.albumResponseSimple) {
      return this.fetchAlbum(this.albumResponseSimple)
                 .then(this.createCollection)
    } else {
      return this.searchForAlbum(this.query)
                 .then(this.fetchAlbum)
                 .then(this.createCollection)
    }
  }

  this.searchForAlbum = function (query) {
    // https://developer.spotify.com/web-api/search-item/
    var url = 'https://api.spotify.com/v1/search?type=album&q='
    url += encodeURIComponent(query)
    return spotify.request(url).then(function (response) {
      if (response.albums &&
          response.albums.items[0] &&
          response.albums.items[0].id) {
        this.searchResponse = response
        return Promise.resolve(response)
      } else {
        return Promise.reject(response)
      }
    })
  }

  this.fetchAlbum = function (response) {
    var id = response.id ? response.id : response.albums.items[0].id
    var url = 'https://api.spotify.com/v1/albums/'
    url += encodeURIComponent(id)
    return spotify.request(url).then(function (response) {
      if (response.tracks &&
          response.tracks.items) {
        this.albumResponse = response
        return Promise.resolve(response)
      } else {
        return Promise.reject(response)
      }
    })
  }

  this.createCollection = function (response) {
    var tracks = response.tracks.items
    var entries = new spotify.Collection()
    for (var i in tracks) {
      var entry = new spotify.Entry(tracks[i], self.query)
      entries.addEntry(entry)
    }
    return entries
  }
}

spotify.Artist = function (query) {
  /**
   * Self reference.
   */
  var self = this

  /**
   * Query string.
   */
  this.query = query.trim()

  /**
   * Dispatch query.
   * @return {Promise | Entry} The artist info.
   */
  this.dispatch = function () {
    return this.searchForArtist(this.query)
               .then(this.fetchAlbums)
               .then(this.fetchTracks)
               .then(this.createCollection)
  }

  this.searchForArtist = function (query) {
    // https://developer.spotify.com/web-api/search-item/
    var url = 'https://api.spotify.com/v1/search?type=artist&q='
    url += encodeURIComponent(query)
    return spotify.request(url).then(function (response) {
      if (response.artists &&
          response.artists.items[0] &&
          response.artists.items[0].id) {
        this.artistResponse = response
        return Promise.resolve(response)
      } else {
        return Promise.reject(response)
      }
    })
  }

  this.fetchAlbums = function (response) {
    var id = response.artists.items[0].id
    var url = 'https://api.spotify.com/v1/artists/'
    url += encodeURIComponent(id) + '/albums'
    return spotify.request(url).then(function (response) {
      if (response.items) {
        this.albumResponse = response
        return Promise.resolve(response)
      } else {
        return Promise.reject(response)
      }
    })
  }

  this.fetchTracks = function (response) {
    var tracks = response.items
    var queries = []
    for (var i in tracks) {
      var album = tracks[i]
      var albumQuery = new spotify.Album(self.query)
      albumQuery.albumResponseSimple = album
      queries.push(albumQuery.dispatch())
    }
    return Promise.all(queries)
  }

  this.createCollection = function (albums) {
    var collection = new spotify.Collection()
    for (var i in albums) {
      var album = albums[i]
      collection = collection.concat(album)
    }
    return collection
  }
}

/**
 * Track query.
 * @constructor
 * @param {string} query - The track to search for.
 */
spotify.Track = function (query) {
  /**
   * Query string.
   */
  this.query = query.trim()

  /**
   * Dispatch query.
   * @return {Promise | Entry} The track info.
   */
  this.dispatch = function () {
    // https://developer.spotify.com/web-api/search-item/
    var url = 'https://api.spotify.com/v1/search?type=track&q='
    url += encodeURIComponent(this.query)
    return spotify.request(url).then(function (result) {
      if (result.tracks &&
          result.tracks.items[0] &&
          result.tracks.items[0].uri) {
        var track = new spotify.Entry(result.tracks.items[0], query)
        return track
      }
    })
  }
}

/**
 * Playlist entries.
 * @constructor
 * @param {string} [entry] - Playlist entry.
 */
spotify.Collection = function (entry) {
  this.entries = []

  this.addEntry = function (entry) {
    this.entries.push(entry)
  }

  this.concat = function (collection) {
    var result = new spotify.Collection()
    result.entries = this.entries
    result.entries = result.entries.concat(collection.entries)
    return result
  }

  if (entry instanceof spotify.Entry) {
    this.entries.push(entry)
  }
}

/**
 * Playlist entry.
 * @constructor
 * @param {string} body - Track data.
 * @param {string} query - Query text.
 */
spotify.Entry = function (body, query) {
  for (var prop in body) {
    this[prop] = body[prop]
  }
  this.query = query
}

/**
 * Represents a playlist.
 * @constructor
 * @param {string} str - The playlist as a string.
 */
spotify.Playlist = function (str) {
  str = str.trim()

  if (str !== '') {
    var tracks = str.split(/\r|\n|\r\n/)
    this.tracks = []

    while (tracks.length > 0) {
      var track = tracks.shift()
      if (track.match(/^#ORDER BY POPULARITY/)) {
        this.order = 'popularity'
      } else if (track !== '') {
        this.tracks.push(track)
      }
    }
  }
}

// function Playlist (order, group) {
//   this.tracks = []
//   this.order = order
//   this.group = group
// }

spotify.findTrack = function (track, callback) {
  // https://developer.spotify.com/web-api/search-item/
  var url = 'https://api.spotify.com/v1/search?type=track&q='
  var uri = ''
  track = encodeURIComponent(track)
  url += track
  setTimeout(function () {
    request(url, function (err, response, body) {
      if (err) { return }
      try {
        body = JSON.parse(body)
        if (!body.error &&
            body.tracks &&
            body.tracks.items[0] &&
            body.tracks.items[0].uri) {
          uri = body.tracks.items[0].uri
          // console.log(uri)
        }
      } catch (e) { }
      callback(false, uri)
    })
  }, 100)
}

spotify.writeList = function (lst, file) {
  fs.writeFile(file, lst.join('\n'), function (err) {
    if (err) { return }
    console.log('Wrote to ' + file)
  })
}

spotify.readTracks = function (coll) {
  var iteratee = function (item, callback) {
    spotify.findTrack(item, function (err, result) {
      console.log(result)
      callback(err, result)
    })
  }

  var callback = function (err, results) {
    if (err) { return }
    async.filter(results, function (track, callback) {
      callback(null, track !== '')
    }, function (err, results) {
      if (err) { return }
      spotify.writeList(results, output)
    })
  }

  async.mapSeries(coll, iteratee, callback)
}

async.mapSeries(spotify.readList(input), spotify.findTrack, function (err, results) {
  if (err) { return }
  async.filter(results, function (track, callback) {
    callback(null, track !== '')
  }, function (err, results) {
    if (err) { return }
    spotify.writeList(results, output)
  })
})

module.exports = spotify
