/* global jQuery:true */
/* exported jQuery */

var http = require('./http')
var util = require('./util')
var URI = require('urijs')
var $ = require('jquery')
jQuery = $

/**
 * Create a web scraper.
 * @constructor
 * @param {string} uri - The URI of the web page to scrape.
 */
function WebScraper (uri, parser) {
  this.uri = uri

  this.parser = parser
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
  return this.scrape(this.uri).then(function (result) {
    console.log(result)
    return self.createQueue(result)
  })
}

/**
 * Scrape a Last.fm tracklist.
 * @param {string} uri - The URI of the web page to scrape.
 * @return {Promise | string} A newline-separated list of tracks.
 */
WebScraper.prototype.lastfm = function (uri) {
  var self = this
  return http(uri).then(function (data) {
    var result = ''
    var html = $($.parseHTML(data))
    if (uri.match(/\/\+tracks/gi)) {
      // tracks by a single artist
      var header = html.find('header a.library-header-crumb')
      if (header.length === 0) {
        header = html.find('h1.header-title')
      }
      var artist = self.trim(header.first().text())
      html.find('td.chartlist-name').each(function () {
        result += artist + ' - ' + self.trim($(this).text()) + '\n'
      })
    } else if (uri.match(/\/\+similar/gi)) {
      // similar artists
      html.find('h3.big-artist-list-title').each(function () {
        result += '#top ' + self.trim($(this).text()) + '\n'
      })
    } else if (uri.match(/\/artists/gi)) {
      // list of artists
      html.find('td.chartlist-name').each(function () {
        result += '#top ' + self.trim($(this).text()) + '\n'
      })
    } else if (uri.match(/\/albums/gi)) {
      // list of albums
      html.find('td.chartlist-name').each(function () {
        result += '#album ' + self.trim($(this).text()) + '\n'
      })
    } else {
      // list of tracks by various artists
      html.find('td.chartlist-name').each(function () {
        result += self.trim($(this).text()) + '\n'
      })
    }
    return result.trim()
  })
}

/**
 * Scrape a Rate Your Music chart.
 * @param {string} uri - The URI of the web page to scrape.
 * @return {Promise | string} A newline-separated list of albums.
 */
WebScraper.prototype.rym = function (uri) {
  var self = this
  return http(uri).then(function (data) {
    var result = ''
    var html = $($.parseHTML(data))
    html.find('div.chart_details').each(function () {
      var artist = self.trim($(this).find('a.artist').text())
      var album = self.trim($(this).find('a.album').text())
      result += '#album ' + artist + ' - ' + album + '\n'
    })
    return result.trim()
  })
}

/**
 * Scrape a web page.
 *
 * This function inspects the host of the web page and invokes an
 * appropriate scraping function. The scraping functions are written
 * in the following manner: they take the web page URI as input and
 * return a generator string as output (wrapped in a Promise).
 * Schematically:
 *
 *           web page:                      generator string
 *     +-------------------+                   (Promise):
 *     | track1 by artist1 |    scraping
 *     +-------------------+    function    artist1 - track1
 *     | track2 by artist2 |    =======>    artist2 - track2
 *     +-------------------+                artist3 - track3
 *     | track3 by artist3 |
 *     +-------------------+
 *
 * In the example above, the scraping function converts a table of
 * tracks to a generator string on the form `ARTIST - TRACK`. If the
 * input was an albums chart, then the output should be a string of
 * `#album` commands instead. In other words, the scraping function
 * should extract the *meaning* of the web page and express it as
 * input that could be passed to the generator.
 *
 * @param {string} uri - The URI of the web page to scrape.
 * @return {Promise | string} A generator string.
 */
WebScraper.prototype.scrape = function (uri) {
  var domain = URI(uri).domain()
  if (domain === 'rateyourmusic.com') {
    return this.rym(uri)
  } else {
    return this.lastfm(uri)
  }
}

/**
 * Clean up a string.
 * @return {string} A new string.
 */
WebScraper.prototype.trim = function (str) {
  str = str || ''
  str = str.trim()
  str = str.replace(/[\s]+/g, ' ')
  str = util.toAscii(str)
  return str
}

module.exports = WebScraper
