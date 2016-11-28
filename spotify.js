var async = require('async')
var fs = require('fs')
var request = require('request')

var input = process.argv[2] || 'list.txt'
var output = process.argv[3] || 'output.txt'

function readList (file) {
  return fs.readFileSync(file, 'utf8').toString().split(/\r?\n/)
}

function findTrack (track, callback) {
  var url = 'https://api.spotify.com/v1/search?type=track&q='
  var uri = ''
  track = encodeURIComponent(track)
  url += track
  setTimeout(function () {
    request(url, function (err, response, body) {
      if (!err) {
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
      }
      callback(false, uri)
    })
  }, 100)
}

function writeList (lst, file) {
  fs.writeFile(file, lst.join('\n'), function (err) {
    if (!err) {
      console.log('Wrote to ' + file)
    }
  })
}

async.mapSeries(readList(input), findTrack, function (err, results) {
  if (!err) {
    async.filter(results, function (track, callback) {
      callback(null, track !== '')
    }, function (err, results) {
      if (!err) {
        writeList(results, output)
      }
    })
  }
})
