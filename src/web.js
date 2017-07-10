/* global jQuery:true */
/* exported jQuery */

var http = require('./http')
var Parser = require('./parser')
var util = require('./util')
var $ = require('jquery')
jQuery = $

/**
 * Create a web scraper.
 * @constructor
 * @param {string} uri - The URI of the webpage to scrape.
 * @param {SpotifyRequestHandler} spotify - Spotify request handler.
 */
function WebScraper (uri, spotify) {
  this.uri = uri

  /**
   * Spotify request handler.
   */
  this.spotify = spotify || new SpotifyRequestHandler()
}

/**
 * Scrape a Last.fm tracklist.
 * @return {Promise | string} A newline-separated list of tracks.
 */
WebScraper.prototype.lastfm = function (uri) {
  return http(this.uri).then(function (data) {
    var result = ''
    var html = $($.parseHTML(data))
    var tracks = html.find('td.chartlist-name')
    tracks.each(function () {
      var track = $(this)
      var title = track.text()
      title = title.trim()
      title = title.replace(/[\s]+/g, ' ')
      title = util.toAscii(title)
      result += title + '\n'
    })
    return result
  })
}

/**
 * Dispatch entry.
 * @return {Promise | Queue} A queue of results.
 */
WebScraper.prototype.dispatch = function () {
  var self = this
  console.log(this.uri)
  return this.lastfm(this.uri).then(function (result) {
    console.log(result)
    var generator = new Parser(result, null, self.spotify)
    return generator.dispatch()
  })
}

module.exports = WebScraper
