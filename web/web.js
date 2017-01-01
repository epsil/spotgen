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

var beachhouse = '## Five hand-picked Beach House tracks\n\n' +
    'Wildflower - Beach House\n' +
    'Walk in the Park - Beach House\n' +
    'Irene - Beach House\n' +
    'Levitation - Beach House\n' +
    'Elegy to the Void - Beach House'

var ambient = '## Five hand-picked ambient albums\n\n' +
    '#album Substrata - Biosphere\n' +
    '#album Selected Ambient Works Volume II - Aphex Twin\n' +
    '#album Apollo - Brian Eno\n' +
    '#album A I A: Alien Observer - Grouper\n' +
    '#album The Magic Place - Julianna Barwick'

var m83 = '## Most popular M83 tracks\n\n' +
    '#top M83'

var spiritualized = '## Various artists similar to Spiritualized\n\n' +
    '#similar Spiritualized'

var moby = '## Various artists similar to Moby,\n' +
    '## ordered by Last.fm rating\n\n' +
    '#order by lastfm\n' +
    '#alternate by artist\n' +
    '#similar Moby'

var deerhunter = '## Complete Deerhunter discography,\n' +
    '## ordered by Last.fm rating\n\n' +
    '#order by lastfm\n' +
    '#artist Deerhunter'

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
  $('#beachhouse').click(insertPlaylist(beachhouse))
  $('#ambient').click(insertPlaylist(ambient))
  $('#m83').click(insertPlaylist(m83))
  $('#spiritualized').click(insertPlaylist(spiritualized))
  $('#moby').click(insertPlaylist(moby))
  $('#deerhunter').click(insertPlaylist(deerhunter))
  $('form').on('submit', clickHandler)
  $('button').tooltip()
  $('textarea').focus()
})
