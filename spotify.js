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

spotify.AlbumQuery = function (query) {
  // ...
}

spotify.ArtistQuery = function (query) {
  // ...
}

spotify.TrackQuery = function (query) {
  this.query = query
  this.dispatch = function (callback) {
    // https://developer.spotify.com/web-api/search-item/
    var url = 'https://api.spotify.com/v1/search?type=track&q='
    var error = false
    var result = {}
    url += encodeURIComponent(this.query)
    setTimeout(function () {
      request(url, function (err, response, body) {
        if (err || response.statusCode !== 200) { return }
        try {
          body = JSON.parse(body)
          if (!body.error &&
              body.tracks &&
              body.tracks.items[0] &&
              body.tracks.items[0].uri) {
            var track = new spotify.Track(body.tracks.items[0], this.query)
            var uri = track.uri
            result = track
            console.log(uri)
          }
        } catch (e) { }
        callback(error, result)
      })
    }, 100)
  }
}

spotify.Track = function (body, query) {
  for (var k in body) {
    this[k] = body[k]
  }
  this.query = query
}

spotify.Playlist = function (str) {
  var playlist = {
    tracks: []
  }

  str = str.trim()

  if (str !== '') {
    playlist.tracks = str.split(/\r|\n|\r\n/)
  }

  return playlist
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
