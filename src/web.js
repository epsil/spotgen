/* global jQuery:true */
/* exported jQuery */

var http = require('./http')
var util = require('./util')
var $ = require('jquery')
jQuery = $

/**
 * Create a web scraper.
 * @constructor
 * @param {SpotifyRequestHandler} spotify - Spotify request handler.
 * @param {string} entry - The album to search for.
 * @param {string} [response] - JSON album object.
 */
function WebScraper (uri) {
  this.uri = uri
}

/**
 * Dispatch entry.
 * @return {Promise | Queue} A queue of tracks.
 */
WebScraper.prototype.dispatch = function () {
  console.log(this.uri)
  http(this.uri).then(function (data) {
    var result = ''
    // console.log(data)
    // console.log('1')
    // console.log($)
    var test = $('<p>test</p>')
    // console.log(test.text())
    var html = $($.parseHTML(data))
    // console.log('2')
    // console.log(html)
    var tracks = html.find('td.chartlist-name')
    tracks.each(function () {
      var track = $(this)
      var title = track.text()
      title = title.trim()
      title = title.replace('—', '-')
      title = title.replace(/[\s]+/g, ' ')
      title = util.toAscii(title)
      console.log(title)
    })
    // console.log('3')
    // console.log(html.text())
    // console.log('4')
    // console.log(tracks.text())
    // console.log('5')
  })
}

module.exports = WebScraper
