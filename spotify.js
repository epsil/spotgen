var async = require('async')
var fs = require('fs')
var request = require('request')

var lst = fs.readFileSync('list.txt').toString().split(/\r?\n/)

// function findArtistTitle (artist, title, callback) {
//   findTrack(title + ' - ' + artist, callback)
// }

function findTrack (track, callback) {
  var url = 'https://api.spotify.com/v1/search?type=track&q=' + track
  request(url, function (err, response, body) {
    if (!err) {
      body = JSON.parse(body)
      if (!body.error) {
        callback(false, body.tracks.items[0].uri)
      } else {
        callback(false, '')
      }
    } else {
      callback(false, '')
    }
  })
}

function printList (lst) {
  var i
  for (i = 0; i < lst.length; i++) {
    console.log(lst[i])
  }
}

async.map(lst, findTrack, function (err, results) {
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
