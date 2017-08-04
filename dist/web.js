/* global jQuery:true, localStorage, URLSearchParams */
/* exported jQuery */
var $ = require('jquery')
jQuery = $
require('bootstrap')
var Generator = require('../lib/generator')
var SpotifyAuth = require('../lib/auth')

console.log = function (message) {
  if (typeof message === 'string') {
    // message = $('.log').text() + message + '\n'
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
      $('a.btn').mouseover()
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
  var button = $('a.btn')
  button.text('Create Playlist')
  button.removeClass('disabled')
  button.removeClass('active')
  button.mouseleave()
  button.tooltip('enable')
  console.log('')
}

function token () {
  var hash = window.location.hash
  hash = hash.replace(/^#/, '')
  var urlParams = new URLSearchParams(hash)
  if (!urlParams.has('access_token')) {
    return ''
  } else {
    return urlParams.get('access_token')
  }
}

function hasToken () {
  return token() !== ''
}

function generate () {
  var textarea = $('textarea')
  var button = $('a.btn')
  var generator = new Generator(textarea.val(), null, null, token())
  button.text('Creating Playlist \u2026')
  button.addClass('active')
  button.addClass('disabled')
  button.mouseleave()
  button.tooltip('disable')
  generator.generate().then(function (result) {
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

function clickHandler () {
  if (hasToken()) {
    generate()
    return false
  } else {
    localStorage.setItem('textarea', $('textarea').val())
    return true
  }
}

$(function () {
  var button = $('a.btn')
  $('.thumbnail a').click(insertPlaylist)
  button.click(clickHandler)
  button.tooltip()
  $('textarea').focus()
  if (hasToken()) {
    if (localStorage.getItem('textarea')) {
      $('textarea').val(localStorage.getItem('textarea'))
      generate()
    }
  } else {
    var spotify = new SpotifyAuth()
    var url = spotify.implicitGrantFlowURI(window.location.href)
    button.attr('href', url)
  }
})
