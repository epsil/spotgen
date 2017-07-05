/* global jQuery:true, localStorage, URLSearchParams */
/* exported jQuery */
var $ = require('jquery')
jQuery = $
require('bootstrap')
var defaults = require('../src/defaults')
// var http = require('../src/http')
var Parser = require('../src/parser')

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

function auth (clientId, uri) {
  clientId = clientId || defaults.id
  uri = uri || window.location.href
  var url = 'https://accounts.spotify.com/authorize'
  url += '/' +
    '?client_id=' + encodeURIComponent(clientId) +
    '&response_type=' + encodeURIComponent('token') +
    '&redirect_uri=' + encodeURIComponent(uri)
  return url
}

function clickHandler () {
  var textarea = $('textarea')
  var button = $('button')
  var generator = Parser(textarea.val())
  button.text('Creating Playlist \u2026')
  button.addClass('active')
  button.addClass('disabled')
  button.mouseleave()
  button.tooltip('disable')
  generator.dispatch().then(function (result) {
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

function clickHandler2 () {
  if (hasToken()) {
    return false
  } else {
    localStorage.setItem('textarea', $('textarea').val())
    return true
  }
}

$(function () {
  $('form').on('submit', clickHandler)
  $('.thumbnail a').click(insertPlaylist)
  $('a.btn').click(clickHandler2)
  $('a.btn').tooltip()
  $('textarea').focus()
  if (hasToken()) {
    if (localStorage.getItem('textarea')) {
      $('textarea').val(localStorage.getItem('textarea'))
    }
  } else {
    $('a.btn').attr('href', auth())
  }
})
