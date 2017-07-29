var eol = require('eol')
var Album = require('./album')
var Artist = require('./artist')
var Generator = require('./generator')
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
  this.spotify = handler || new SpotifyRequestHandler(null, null, token)
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
      var line = lines.shift().trim()
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
      } else if ((match = line.match(/^#PLAYLIST([0-9]*)\s+([0-9a-z]+)[\s/]([0-9a-z]+)/i))) {
        generator.add(new Playlist(this.spotify, line, match[3], match[2], parseInt(match[1])))
      } else if ((match = line.match(/^#PLAYLIST([0-9]*)\s+(.*)/i))) {
        generator.add(new Playlist(this.spotify, match[2], null, null, parseInt(match[1])))
      } else if ((match = line.match(/^#EXTINF(:[0-9]+,(.*))?/i))) {
        if (match[1]) {
          generator.add(new Track(this.spotify, match[2]))
          if (lines.length > 0 &&
              !lines[0].match(/^#/)) {
            lines.shift()
          }
        }
      } else if ((match = line.match(/spotify:artist:([0-9a-z]+)/i))) {
        generator.add(new Artist(this.spotify, line, match[1]))
      } else if ((match = line.match(/^([0-9]+ )?https?:\/\/(.*\.)?spotify\.com\/(.*\/)*artist\/(.*\/)*([0-9a-z]+)/i))) {
        generator.add(new Artist(this.spotify, line, match[5], parseInt(match[1])))
      } else if ((match = line.match(/spotify:album:([0-9a-z]+)/i))) {
        generator.add(new Album(this.spotify, line, match[1]))
      } else if ((match = line.match(/^([0-9]+ )?https?:\/\/(.*\.)?spotify\.com\/(.*\/)*album\/(.*\/)*([0-9a-z]+)/i))) {
        generator.add(new Album(this.spotify, line, match[5], parseInt(match[1])))
      } else if ((match = line.match(/spotify:user:([0-9a-z]+):playlist:([0-9a-z]+)/i))) {
        generator.add(new Playlist(this.spotify, line, match[2], match[1]))
      } else if ((match = line.match(/^([0-9]+ )?https?:\/\/(.*\.)?spotify\.com\/(.*\/)*user\/([0-9a-z]+)\/playlist\/([0-9a-z]+)/i))) {
        generator.add(new Playlist(this.spotify, line, match[5], match[4], parseInt(match[1])))
      } else if ((match = line.match(/spotify:track:([0-9a-z]+)/i))) {
        generator.add(new Track(this.spotify, line, match[1]))
      } else if ((match = line.match(/^([0-9]+ )?https?:\/\/(.*\.)?spotify\.com\/(.*\/)*([0-9a-z]+)/i))) {
        generator.add(new Track(this.spotify, line, match[4]))
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
