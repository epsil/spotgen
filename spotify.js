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

spotify.Album = function (query) {
  this.query = query.trim()
  this.dispatch = function () {
    var url = 'https://api.spotify.com/v1/search?type=album&q='
    url += encodeURIComponent(query)
    return spotify.request(url).then(function (result) {
      if (result.albums &&
          result.albums.items[0] &&
          result.albums.items[0].id) {
        return result.albums.items[0].id
      }
    })
  }
}

spotify.Artist = function (query) {
  // ...
}

spotify.Track = function (query) {
  this.query = query.trim()
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

spotify.Entries = function (entry) {
  this.entries = []

  this.addEntry = function (entry) {
    this.entries.push(entry)
  }

  if (entry instanceof spotify.Entry) {
    this.entries.push(entry)
  }
}

spotify.Entry = function (body, query) {
  for (var k in body) {
    this[k] = body[k]
  }
  this.query = query
}

/**
 * Represents a playlist.
 * @constructor
 * @param {string} str - The playlist as a string
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
          console.log(uri)
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
