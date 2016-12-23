var Playlist = require('../lib/playlist')

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
    var playlist = new Playlist(textarea.value)
    playlist.dispatch().then(function (result) {
      console.log('')
      textarea.value = result
      textarea.focus()
      textarea.select()
    })
    return false
  }
})
