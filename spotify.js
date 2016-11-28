var async = require('async')
var fs = require('fs')
var request = require('request')

var lst = fs.readFileSync('list.txt', 'utf8').toString().split(/\r?\n/)

// function findArtistTitle (artist, title, callback) {
//   findTrack(title + ' - ' + artist, callback)
// }

function findTrack (track, callback) {
  var url = 'https://api.spotify.com/v1/search?type=track&q='
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
            var uri = body.tracks.items[0].uri
            // console.log('0: ' + url)
            callback(false, uri)
          } else {
            // console.log('1: ' + url)
            // console.log(body)
            callback(false, '')
          }
        } catch(err) {
          // console.log('2: ' + url)
          callback(false, '')
        }
      } else {
        // console.log('3: ' + url)
        callback(false, '')
      }
    })
  }, 100)
}

function printList (lst) {
  var i
  for (i = 0; i < lst.length; i++) {
    console.log(lst[i])
  }
}

async.mapSeries(lst, findTrack, function (err, results) {
  if (!err) {
    async.filter(results, function (track, callback) {
      callback(null, track !== '')
    }, function (err, results) {
      if (!err) {
        printList(results)
      }
    })
  }
})
