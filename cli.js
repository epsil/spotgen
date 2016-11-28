var request = require('request')

function findArtistTitle (artist, title, callback) {
  findTrack(title + ' - ' + artist, callback)
}

function findTrack (track, callback) {
  var url = 'https://api.spotify.com/v1/search?type=track&q=' + track
  request(url, function (error, response, body) {
    if (!error) {
      body = JSON.parse(body)
      callback(body.tracks.items[0].uri)
    }
  })
}

findArtistTitle('Beach House', 'Walk in the Park', console.log)
