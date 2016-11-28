/* global $, alert */

function findTrack (artist, title, callback) {
  $.ajax({
    url: 'https://api.spotify.com/v1/search',
    data: {
      q: title + ' - ' + artist,
      type: 'track'
    },
    success: function (response) {
      callback(response.tracks.items[0].uri)
    }
  })
}

$(function () {
  findTrack('Beach House', 'Walk in the Park', alert)
})
