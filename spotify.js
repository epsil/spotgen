#!/usr/bin/env node

/* eslint-disable no-unused-vars */
var async = require('async')
var fs = require('fs')
var request = require('request')

var input = process.argv[2] || 'input.txt'
var output = process.argv[3] || 'output.txt'

function readList (file) {
  return fs.readFileSync(file, 'utf8').toString().split(/\r|\n|\r\n/)
}

function AlbumQuery (query) {
  // ...
}

function ArtistQuery (query) {
  // ...
}

function TrackQuery (query) {
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
            var track = new Track(body.tracks.items[0], this.query)
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

function Track (body, query) {
  for (var k in body) {
    this[k] = body[k]
  }
  this.query = query
}

function Playlist (order, group) {
  this.tracks = []
  this.order = order
  this.group = group
}

function findTrack (track, callback) {
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

function writeList (lst, file) {
  fs.writeFile(file, lst.join('\n'), function (err) {
    if (err) { return }
    console.log('Wrote to ' + file)
  })
}

function readTracks (coll) {
  var iteratee = function (item, callback) {
    findTrack(item, function (err, result) {
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
      writeList(results, output)
    })
  }

  async.mapSeries(coll, iteratee, callback)
}

async.mapSeries(readList(input), findTrack, function (err, results) {
  if (err) { return }
  async.filter(results, function (track, callback) {
    callback(null, track !== '')
  }, function (err, results) {
    if (err) { return }
    writeList(results, output)
  })
})
