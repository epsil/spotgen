var spotify = require('../spotify')

document.addEventListener('DOMContentLoaded', function () {
  var form = document.querySelector('form')
  var textarea = document.querySelector('textarea')
  var log = document.querySelector('.log')

  console.log = function (message) {
    if (typeof message === 'string') {
      log.innerHTML = message
    }
  }

  form.onsubmit = function () {
    var playlist = new spotify.Playlist(textarea.value)
    playlist.dispatch().then(function (result) {
      console.log('')
      textarea.value = result
      textarea.focus()
      textarea.select()
    })
    return false
  }
})
