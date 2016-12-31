var Playlist = require('../lib/playlist')
var $ = require('jquery')

function clickHandler (str) {
  return function () {
    $('textarea').val(str)
    $('textarea').focus()
    return false
  }
}

$(function () {
  $('#aphextwin').click(clickHandler('#top Aphex Twin'))
  $('#deerhunter').click(clickHandler('#similar Deerhunter'))
  $('#beachhouse').click(clickHandler('#order by lastfm\n#artist Beach House'))
  var ambient = '#album Substrata - Biosphere\n' +
      '#album Selected Ambient Works Volume II - Aphex Twin\n' +
      '#album Apollo - Brian Eno\n' +
      '#album A I A: Alien Observer - Grouper\n' +
      '#album The Magic Place - Julianna Barwick\n' +
      '#album Talk Amongst the Trees - Eluvium\n' +
      '#album New Age Of Earth - Ashra\n' +
      '#album Orbvs Terrarvm - The Orb\n' +
      '#album Harmony in Ultraviolet - Tim Hecker\n' +
      '#album And Their Refinement of the Decline - Stars of the Lid'
  $('#ambient').click(clickHandler(ambient))
  var djshadow = '#order by lastfm\n' +
      '#alternate by artist\n' +
      '#similar DJ Shadow'
  $('#djshadow').click(clickHandler(djshadow))
  $('#tremblingbluestars').click(clickHandler('#similar Trembling Blue Stars'))
})

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
      if (result === '') {
        button.innerHTML = 'Create Playlist'
        button.classList.remove('active')
      } else {
        button.innerHTML = 'Created Playlist'
        console.log('Copy and paste the above ' +
                    'into a new Spotify playlist')
      }
    })
    return false
  }
})
