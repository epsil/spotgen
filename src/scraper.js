/* global jQuery:true */
/* exported jQuery */

var http = require('./http')
var util = require('./util')
var $ = require('jquery')
jQuery = $

/**
 * Create a web scraper.
 * @constructor
 * @param {string} uri - The URI of the webpage to scrape.
 */
function WebScraper (uri, parser) {
  this.uri = uri

  this.parser = parser
}

/**
 * Clean up a string.
 * @return {string} A new string.
 */
WebScraper.prototype.cleanup = function (str) {
  str = str.trim()
  str = str.replace(/[\s]+/g, ' ')
  str = util.toAscii(str)
  return str
}

/**
 * Create a queue of tracks.
 * @param {string} result - A newline-separated list of tracks.
 * @return {Promise | Queue} A queue of results.
 */
WebScraper.prototype.createQueue = function (result) {
  var generator = this.parser.parse(result)
  return generator.dispatch()
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
    return self.createQueue(result)
  })
}

/**
 * Scrape a Last.fm tracklist.
 * @return {Promise | string} A newline-separated list of tracks.
 */
WebScraper.prototype.lastfm = function (uri) {
  var self = this
  return http(uri).then(function (data) {
    var result = ''
    var html = $($.parseHTML(data))
    var tracks = html.find('td.chartlist-name')
    tracks.each(function () {
      var track = $(this).text()
      track = self.cleanup(track)
      result += track + '\n'
    })
    return result.trim()
  })
}

module.exports = WebScraper
