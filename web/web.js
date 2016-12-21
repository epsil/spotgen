var spotify = require('../spotify')

document.addEventListener('DOMContentLoaded', function () {
  var form = document.querySelector('form')
  form.onsubmit = function () {
    var textarea = document.querySelector('textarea')
    var playlist = new spotify.Playlist(textarea.value)
    playlist.dispatch().then(function (result) {
      textarea.value = result
      textarea.focus()
      textarea.select()
    })
    return false
  }
})
