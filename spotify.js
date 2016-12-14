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
spotify.Album = function (body, query) {
  for (var prop in body) {
    this[prop] = body[prop]
  }

  this.query = query.trim()

  this.dispatch = function () {
    if (this.id) {
      return this.fetch(this.id)
                 .then(this.entries)
    } else {
      return this.search(this.query)
                 .then(this.result)
                 .then(this.fetch)
                 .then(this.entries)
    }
  }

  this.search = function (query) {
    var url = 'https://api.spotify.com/v1/search?type=album&q='
    url += encodeURIComponent(query)
    return spotify.request(url)
  }

  this.result = function (body) {
    if (body.albums &&
        body.albums.items[0] &&
        body.albums.items[0].id) {
      this.id = body.albums.items[0].id
      return this.id
    }
  }

  this.fetch = function (id) {
    var url = 'https://api.spotify.com/v1/albums/'
    url += encodeURIComponent(id)
    return spotify.request(url)
  }

  this.entries = function (result) {
    if (result.tracks &&
        result.tracks.items) {
      var tracks = result.tracks.items
      var entries = new spotify.Collection()
      for (var i in tracks) {
        var entry = new spotify.Entry(tracks[i], query)
        entries.addEntry(entry)
      }
      return entries
    }
  }
}

spotify.Artist = function (query, id) {
  /**
   * Query string.
   */
  this.query = query.trim()
  this.id = id

  /**
   * Dispatch query.
   * @return {Promise | Entry} The track info.
   */
  this.dispatch = function () {
    var query = this.query
    var url = 'https://api.spotify.com/v1/search?type=artist&q='
    url += encodeURIComponent(query)
    return spotify.request(url).then(function (result) {
      if (result.artists &&
          result.artists.items[0] &&
          result.artists.items[0].id) {
        this.id = result.artists.items[0].id
        return this.id
      }
    }).then(function (id) {
      var url = 'https://api.spotify.com/v1/artists/'
      url += encodeURIComponent(id) + '/albums'
      console.log(url)
      return spotify.request(url)
    }).then(function (result) {
      if (result.items) {
        var items = result.items
        var albums = []
        for (var i in items) {
          var entry = new spotify.Entry(tracks[i], query)
          entries.addEntry(entry)
        }

        return this.id
    })
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
    var query = this.query
    var url = 'https://api.spotify.com/v1/search?type=track&q='
    url += encodeURIComponent(query)
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
