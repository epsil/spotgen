var defaults = require('./defaults')
var eol = require('eol')
var Album = require('./album')
var Artist = require('./artist')
var Generator = require('./generator')
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
  this.spotify = handler || new SpotifyRequestHandler(defaults.id, defaults.key, token)
}

/**
 * Parse a string and create a playlist generator.
 * @param {string} [str] - A newline-separated string of
 * entries on the form `TITLE - ARTIST`. May also contain
 * `#ALBUM`, `#ARTIST`, `#ORDER` and `#GROUP` commands.
 * @return {Generator} A playlist generator.
 */
Parser.prototype.parse = function (str) {
  var generator = new Generator(this.spotify)
  str = str.trim()
  if (str) {
    var lines = eol.split(str)
    while (lines.length > 0) {
      var match = null
      var line = lines.shift()
      if ((match = line.match(/^#(SORT|ORDER)\s+BY\s+([^\s]*)(\s+([^\s]*))?/i))) {
        generator.ordering = match[2].toLowerCase()
        generator.lastfmUser = match[4]
      } else if ((match = line.match(/^#GROUP\s+BY\s+(.*)/i))) {
        generator.grouping = match[1].toLowerCase()
      } else if ((match = line.match(/^#ALTERNATE\s+BY\s+(.*)/i))) {
        generator.alternating = match[1].toLowerCase()
      } else if (line.match(/^#(DUP(LICATES?)?|NONUNIQUE|NONDISTINCT)/i)) {
        generator.unique = false
      } else if (line.match(/^#REVERSE/i)) {
        generator.reverse = true
      } else if (line.match(/^#SHUFFLE/i)) {
        generator.shuffle = true
      } else if (line.match(/^#(UNIQUE|DISTINCT)/i)) {
        generator.unique = true
      } else if (line.match(/^#DEDUP/i)) {
        generator.unique = false
      } else if (line.match(/^#(CSV|CVS)/i)) {
        generator.csv = true
      } else if (line.match(/^##/i) ||
                 line.match(/^#EXTM3U/i) ||
                 line.match(/^sep=,/i)) {
        // comment
      } else if ((match = line.match(/^#ALBUM((ID)?)([0-9]*)\s+(.*)/i))) {
        var album = new Album(this.spotify, match[4], null, parseInt(match[3]))
        if (match[2]) {
          album.fetchTracks = false
        }
        generator.add(album)
      } else if ((match = line.match(/^#ARTIST([0-9]*)\s+(.*)/i))) {
        generator.add(new Artist(this.spotify, match[2], null, parseInt(match[1])))
      } else if ((match = line.match(/^#TOP([0-9]*)\s+(.*)/i))) {
        generator.add(new Top(this.spotify, match[2], null, parseInt(match[1])))
      } else if ((match = line.match(/^#SIMILAR([0-9]*)\s+(.*)/i))) {
        generator.add(new Similar(this.spotify, match[2], null, parseInt(match[1])))
      } else if (line.match(/^#EXTINF/i)) {
        match = line.match(/^#EXTINF:[0-9]+,(.*)/i)
        if (match) {
          generator.add(new Track(this.spotify, match[1]))
          if (lines.length > 0 &&
              !lines[0].match(/^#/)) {
            lines.shift()
          }
        }
      } else if (line.match(/spotify:artist:[0-9a-z]+/i)) {
        generator.add(new Artist(this.spotify, line, line.match(/[0-9a-z]+$/i)))
      } else if (line.match(/^https?:\/\/(.*\.)?spotify\.com\/(.*\/)?artist/i)) {
        generator.add(new Artist(this.spotify, line, line.match(/[0-9a-z]+$/i)))
      } else if (line.match(/spotify:album:[0-9a-z]+/i)) {
        generator.add(new Album(this.spotify, line, line.match(/[0-9a-z]+$/i)))
      } else if (line.match(/^https?:\/\/(.*\.)?spotify\.com\/(.*\/)?album/i)) {
        generator.add(new Album(this.spotify, line, line.match(/[0-9a-z]+$/i)))
      } else if (line.match(/spotify:track:[0-9a-z]+/i)) {
        generator.add(new Track(this.spotify, line, line.match(/[0-9a-z]+$/i)))
      } else if (line.match(/^https?:\/\/(.*\.)?spotify\.com/i)) {
        generator.add(new Track(this.spotify, line, line.match(/[0-9a-z]+$/i)))
      } else if ((match = line.match(/^([0-9]+ )?(https?:.*)/i))) {
        generator.add(new WebScraper(match[2], parseInt(match[1]), this))
      } else if (line) {
        generator.add(new Track(this.spotify, line))
      }
    }
  }
  return generator
}

module.exports = Parser
