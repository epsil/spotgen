var eol = require('eol')
var Album = require('./album')
var Artist = require('./artist')
var Collection = require('./collection')
var Playlist = require('./playlist')
var Similar = require('./similar')
var SpotifyRequestHandler = require('./spotify')
var Top = require('./top')
var Track = require('./track')
var WebScraper = require('./scraper')

/**
 * Create a parser.
 * @constructor
 */
function Parser (token, handler) {
  /**
   * Spotify request handler.
   */
  this.spotify = handler || new SpotifyRequestHandler(null, null, token)
}

/**
 * Parse a string and create a playlist collection.
 * @param {string} [str] - A newline-separated string of
 * entries on the form `TITLE - ARTIST`. May also contain
 * `#ALBUM`, `#ARTIST`, `#ORDER` and `#GROUP` commands.
 * @return {Collection} A playlist collection.
 */
Parser.prototype.parse = function (str) {
  var collection = new Collection(this.spotify)
  str = str.trim()
  if (str) {
    var lines = eol.split(str)
    while (lines.length > 0) {
      var match = null
      var line = lines.shift().trim()
      if ((match = line.match(/^#(SORT|ORDER)\s+BY\s+([^\s]*)(\s+([^\s]*))?/i))) {
        collection.ordering = match[2].toLowerCase()
        collection.lastfmUser = match[4]
      } else if ((match = line.match(/^#GROUP\s+BY\s+(.*)/i))) {
        collection.grouping = match[1].toLowerCase()
      } else if ((match = line.match(/^#(ALTERNATE|INTERLEAVE)\s+BY\s+(.*)/i))) {
        collection.alternating = match[2].toLowerCase()
      } else if (line.match(/^#(DUP(LICATES?)?|NONUNIQUE|NONDISTINCT)/i)) {
        collection.unique = false
      } else if (line.match(/^#REVERSE/i)) {
        collection.reverse = true
      } else if (line.match(/^#SHUFFLE/i)) {
        collection.shuffle = true
      } else if (line.match(/^#(UNIQUE|DISTINCT)/i)) {
        collection.unique = true
      } else if (line.match(/^#DEDUP/i)) {
        collection.unique = false
      } else if (line.match(/^#(CSV|CVS)/i)) {
        collection.csv = true
      } else if (line.match(/^##/i) ||
                 line.match(/^#EXTM3U/i) ||
                 line.match(/^sep=,/i)) {
        // comment
      } else if ((match = line.match(/^#ALBUM((ID)?)([0-9]*)\s+(.*)/i))) {
        var album = new Album(this.spotify, match[4], null, parseInt(match[3]))
        if (match[2]) {
          album.fetchTracks = false
        }
        collection.add(album)
      } else if ((match = line.match(/^#ARTIST([0-9]*)\s+(.*)/i))) {
        collection.add(new Artist(this.spotify, match[2], null, parseInt(match[1])))
      } else if ((match = line.match(/^#TOP([0-9]*)\s+(.*)/i))) {
        collection.add(new Top(this.spotify, match[2], null, parseInt(match[1])))
      } else if ((match = line.match(/^#SIMILAR([0-9]*)\s+(.*)/i))) {
        collection.add(new Similar(this.spotify, match[2], null, parseInt(match[1])))
      } else if ((match = line.match(/^#PLAYLIST([0-9]*)\s+([0-9a-z]+)[\s/]([0-9a-z]+)/i))) {
        collection.add(new Playlist(this.spotify, line, match[3], match[2], parseInt(match[1])))
      } else if ((match = line.match(/^#PLAYLIST([0-9]*)\s+(.*)/i))) {
        collection.add(new Playlist(this.spotify, match[2], null, null, parseInt(match[1])))
      } else if ((match = line.match(/^#EXTINF(:[0-9]+,(.*))?/i))) {
        if (match[1]) {
          collection.add(new Track(this.spotify, match[2]))
          if (lines.length > 0 &&
              !lines[0].match(/^#/)) {
            lines.shift()
          }
        }
      } else if ((match = line.match(/spotify:artist:([0-9a-z]+)/i))) {
        collection.add(new Artist(this.spotify, line, match[1]))
      } else if ((match = line.match(/^([0-9]+ )?https?:\/\/(.*\.)?spotify\.com\/(.*\/)*artist\/(.*\/)*([0-9a-z]+)/i))) {
        collection.add(new Artist(this.spotify, line, match[5], parseInt(match[1])))
      } else if ((match = line.match(/spotify:album:([0-9a-z]+)/i))) {
        collection.add(new Album(this.spotify, line, match[1]))
      } else if ((match = line.match(/^([0-9]+ )?https?:\/\/(.*\.)?spotify\.com\/(.*\/)*album\/(.*\/)*([0-9a-z]+)/i))) {
        collection.add(new Album(this.spotify, line, match[5], parseInt(match[1])))
      } else if ((match = line.match(/spotify:user:([0-9a-z]+):playlist:([0-9a-z]+)/i))) {
        collection.add(new Playlist(this.spotify, line, match[2], match[1]))
      } else if ((match = line.match(/^([0-9]+ )?https?:\/\/(.*\.)?spotify\.com\/(.*\/)*user\/([0-9a-z]+)\/playlist\/([0-9a-z]+)/i))) {
        collection.add(new Playlist(this.spotify, line, match[5], match[4], parseInt(match[1])))
      } else if ((match = line.match(/spotify:track:([0-9a-z]+)/i))) {
        collection.add(new Track(this.spotify, line, match[1]))
      } else if ((match = line.match(/^([0-9]+ )?https?:\/\/(.*\.)?spotify\.com\/(.*\/)*([0-9a-z]+)/i))) {
        collection.add(new Track(this.spotify, line, match[4]))
      } else if ((match = line.match(/^([0-9]+ )?(https?:.*)/i))) {
        collection.add(new WebScraper(match[2], parseInt(match[1]), this))
      } else if (line) {
        collection.add(new Track(this.spotify, line))
      }
    }
  }
  return collection
}

module.exports = Parser
