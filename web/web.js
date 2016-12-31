var Playlist = require('../lib/playlist')
var $ = require('jquery')

function clickHandler (str) {
  return function () {
    $('textarea').val(str)
    $('html, body').stop().animate({scrollTop: 0}, '500', 'swing', function () {
      $('textarea').focus()
    })
    return false
  }
}

$(function () {
  var beachhouse = '## Five hand-picked Beach House tracks\n\n' +
      'Wildflower - Beach House\n' +
      'Walk in the Park - Beach House\n' +
      'Irene - Beach House\n' +
      'Levitation - Beach House\n' +
      'Elegy to the Void - Beach House'
  $('#beachhouse').click(clickHandler(beachhouse))
  var ambient = '## Five hand-picked ambient albums\n\n' +
      '#album Substrata - Biosphere\n' +
      '#album Selected Ambient Works Volume II - Aphex Twin\n' +
      '#album Apollo - Brian Eno\n' +
      '#album A I A: Alien Observer - Grouper\n' +
      '#album The Magic Place - Julianna Barwick'
  $('#ambient').click(clickHandler(ambient))
  var aphextwin = '## Most popular Aphex Twin tracks\n\n' +
      '#top Aphex Twin'
  $('#aphextwin').click(clickHandler(aphextwin))
  var tremblingbluestars = '## Various artists similar to Trembling Blue Stars\n\n' +
      '#similar Trembling Blue Stars'
  $('#tremblingbluestars').click(clickHandler(tremblingbluestars))
  var djshadow = '## Various artists similar to DJ Shadow,\n' +
      '## ordered by Last.fm rating\n\n' +
      '#order by lastfm\n' +
      '#alternate by artist\n' +
      '#similar DJ Shadow'
  $('#djshadow').click(clickHandler(djshadow))
  var deerhunter = '## Complete Deerhunter discography,\n' +
      '## ordered by Last.fm rating\n\n' +
      '#order by lastfm\n' +
      '#artist Deerhunter'
  $('#deerhunter').click(clickHandler(deerhunter))
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
