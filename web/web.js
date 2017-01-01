/* global jQuery:true */
/* exported jQuery */
var Playlist = require('../lib/playlist')
var $ = require('jquery')
jQuery = $
require('bootstrap')

console.log = function (message) {
  if (typeof message === 'string') {
    $('.log').text(message)
  }
}

function insertPlaylist (str) {
  return function () {
    resetButton()
    $('textarea').val(str)
    $('html, body').stop().animate({scrollTop: 0}, '500', 'swing', function () {
      $('textarea').focus()
      $('button').mouseover()
    })
    return false
  }
}

function resetButton () {
  var button = $('button')
  button.text('Create Playlist')
  button.removeClass('disabled')
  button.removeClass('active')
  button.mouseleave()
  button.tooltip('enable')
  console.log('')
}

function clickHandler () {
  var form = $('form')
  var textarea = $('textarea')
  var button = $('button')
  var playlist = new Playlist(textarea.val())
  button.text('Creating Playlist \u2026')
  button.addClass('active')
  button.addClass('disabled')
  button.mouseleave()
  button.tooltip('disable')
  playlist.dispatch().then(function (result) {
    console.log('')
    button.removeClass('disabled')
    textarea.val(result)
    textarea.focus()
    textarea.select()
    if (result === '') {
      resetButton()
    } else {
      button.text('Created Playlist')
      console.log('Copy and paste the above ' +
                  'into a new Spotify playlist')
    }
  })
  return false
}

$(function () {
  var beachhouse = '## Five hand-picked Beach House tracks\n\n' +
      'Wildflower - Beach House\n' +
      'Walk in the Park - Beach House\n' +
      'Irene - Beach House\n' +
      'Levitation - Beach House\n' +
      'Elegy to the Void - Beach House'
  $('#beachhouse').click(insertPlaylist(beachhouse))
  var ambient = '## Five hand-picked ambient albums\n\n' +
      '#album Substrata - Biosphere\n' +
      '#album Selected Ambient Works Volume II - Aphex Twin\n' +
      '#album Apollo - Brian Eno\n' +
      '#album A I A: Alien Observer - Grouper\n' +
      '#album The Magic Place - Julianna Barwick'
  $('#ambient').click(insertPlaylist(ambient))
  var aphextwin = '## Most popular Aphex Twin tracks\n\n' +
      '#top Aphex Twin'
  $('#aphextwin').click(insertPlaylist(aphextwin))
  var tremblingbluestars = '## Various artists similar to Trembling Blue Stars\n\n' +
      '#similar Trembling Blue Stars'
  $('#tremblingbluestars').click(insertPlaylist(tremblingbluestars))
  var djshadow = '## Various artists similar to DJ Shadow,\n' +
      '## ordered by Last.fm rating\n\n' +
      '#order by lastfm\n' +
      '#alternate by artist\n' +
      '#similar DJ Shadow'
  $('#djshadow').click(insertPlaylist(djshadow))
  var deerhunter = '## Complete Deerhunter discography,\n' +
      '## ordered by Last.fm rating\n\n' +
      '#order by lastfm\n' +
      '#artist Deerhunter'
  $('#deerhunter').click(insertPlaylist(deerhunter))

  $('form').on('submit', clickHandler)
  $('button').tooltip()
  $('textarea').focus()
})
