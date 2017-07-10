/* global jQuery:true */
/* exported jQuery */

var http = require('./http')
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
}

module.exports = WebScraper
