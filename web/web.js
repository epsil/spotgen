var Playlist = require('../lib/playlist')

document.addEventListener('DOMContentLoaded', function () {
  var form = document.querySelector('form')
  var textarea = document.querySelector('textarea')
  var button = document.querySelector('button')
  var log = document.querySelector('.log')

  console.log = function (message) {
    if (typeof message === 'string') {
      log.innerHTML = message
    }
  }

  textarea.focus()

  form.onsubmit = function () {
    var playlist = new Playlist(textarea.value)
    button.innerHTML = 'Creating Playlist &hellip;'
    button.classList.add('active')
    button.classList.add('disabled')
    playlist.dispatch().then(function (result) {
      console.log('')
      button.classList.remove('disabled')
      textarea.value = result
      textarea.focus()
      textarea.select()
      if (result !== '') {
        button.innerHTML = 'Created Playlist'
        console.log('Copy and paste the above ' +
                    'into a new Spotify playlist')
      }
    })
    return false
  }
})
