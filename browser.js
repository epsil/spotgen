/* global $ */

function findArtistTitle (artist, title, callback) {
  findTrack(title + ' - ' + artist, callback)
}

function findTrack (track, callback) {
  $.ajax({
    url: 'https://api.spotify.com/v1/search',
    data: {
      q: track,
      type: 'track'
    },
    success: function (response) {
      callback(response.tracks.items[0].uri)
    }
  })
}

$(function () {
  findArtistTitle('Beach House', 'Walk in the Park', function (result) {
    $('body').append(result)
  })
})
