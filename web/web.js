/* global jQuery:true */
/* exported jQuery */
var Parser = require('../src/parser')
var defaults = require('../src/defaults')
var http = require('../src/http')
var $ = require('jquery')
jQuery = $
require('bootstrap')

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
  url += '/?client_id=' + encodeURIComponent(clientId) +
    '&response_type=' + encodeURIComponent('code') +
    '&redirect_uri=' + encodeURIComponent(uri)
  return url
  // clientSecret = clientSecret || defaults.key
  // grantType = grantType || 'client_credentials'
  // var auth = 'Basic ' + base64.encode(clientId + ':' + clientSecret)
  // var uri = 'https://accounts.spotify.com/api/token'
  // return http.json(uri, {
  //   'method': 'POST',
  //   'headers': {
  //     'Authorization': auth
  //   },
  //   'form': {
  //     'grant_type': grantType
  //   }
  // })
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

function clickHandler2 () {
  alert('test')
  if (true) {
    return true
  } else {
    return false
  }
}

$(function () {
  $('form').on('submit', clickHandler)
  $('.thumbnail a').click(insertPlaylist)
  // $('button').after('<a href="' + auth() + '">test</a>')
  // $('button').after('<p>test</p>')
  // $('button').tooltip()
  $('a.btn').attr('href', auth())
  $('a.btn').click(clickHandler2)
  $('a.btn').tooltip()
  $('textarea').focus()
})
