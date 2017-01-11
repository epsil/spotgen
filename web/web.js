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

function insertPlaylist () {
  resetButton()
  var str = $(this).find('pre').text()
  var callback = function () {
    $('textarea').val(str)
    $('textarea').focus()
    setTimeout(function () {
      $('button').mouseover()
    }, 1000)
  }
  if ($('html').scrollTop() === 0) {
    callback()
  } else {
    $('html, body').stop().animate({scrollTop: 0}, '500', 'swing', callback)
  }
  return false
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
  $('form').on('submit', clickHandler)
  $('.thumbnail a').click(insertPlaylist)
  $('button').tooltip()
  $('textarea').focus()
})
