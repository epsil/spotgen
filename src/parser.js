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
      var line = lines.shift()
      if (line.match(/^#(SORT|ORDER)\s+BY/i)) {
        var orderMatch = line.match(/^#(SORT|ORDER)\s+BY\s+([^\s]*)(\s+([^\s]*))?/i)
        generator.ordering = orderMatch[2].toLowerCase()
        generator.lastfmUser = orderMatch[4]
      } else if (line.match(/^#GROUP\s+BY/i)) {
        var groupMatch = line.match(/^#GROUP\s+BY\s+(.*)/i)
        generator.grouping = groupMatch[1].toLowerCase()
      } else if (line.match(/^#ALTERNATE\s+BY/i)) {
        var alternateMatch = line.match(/^#ALTERNATE\s+BY\s+(.*)/i)
        generator.alternating = alternateMatch[1].toLowerCase()
      } else if (line.match(/^#(DUP(LICATES?)?|NONUNIQUE|NONDISTINCT)/i)) {
        generator.unique = false
      } else if (line.match(/^#REVERSE/i)) {
        generator.reverse = true
      } else if (line.match(/^#SHUFFLE/i)) {
        generator.shuffle = true
      } else if (line.match(/^#(UNIQUE|DISTINCT)/i)) {
        generator.unique = true
      } else if (line.match(/^#(CSV|CVS)/i)) {
        generator.csv = true
      } else if (line.match(/^##/i) ||
                 line.match(/^#EXTM3U/i) ||
                 line.match(/^sep=,/i)) {
        // comment
      } else if (line.match(/^#ALBUM(ID)?[0-9]*\s+/i)) {
        var albumMatch = line.match(/^#ALBUM((ID)?)([0-9]*)\s+(.*)/i)
        var albumId = albumMatch[2]
        var albumLimit = parseInt(albumMatch[3])
        var albumEntry = albumMatch[4]
        var album = new Album(this.spotify, albumEntry)
        album.setLimit(albumLimit)
        if (albumId) {
          album.fetchTracks = false
        }
        generator.add(album)
      } else if (line.match(/^#ARTIST[0-9]*\s+/i)) {
        var artistMatch = line.match(/^#ARTIST([0-9]*)\s+(.*)/i)
        var artistLimit = parseInt(artistMatch[1])
        var artistEntry = artistMatch[2]
        var artist = new Artist(this.spotify, artistEntry)
        artist.setLimit(artistLimit)
        generator.add(artist)
      } else if (line.match(/^#TOP[0-9]*\s+/i)) {
        var topMatch = line.match(/^#TOP([0-9]*)\s+(.*)/i)
        var topLimit = parseInt(topMatch[1])
        var topEntry = topMatch[2]
        var top = new Top(this.spotify, topEntry)
        top.setLimit(topLimit)
        generator.add(top)
      } else if (line.match(/^#SIMILAR[0-9]*\s+/i)) {
        var similarMatch = line.match(/^#SIMILAR([0-9]*)\s+(.*)/i)
        var similarLimit = parseInt(similarMatch[1])
        var similarEntry = similarMatch[2]
        var similar = new Similar(this.spotify, similarEntry)
        similar.setLimit(similarLimit)
        generator.add(similar)
      } else if (line.match(/^#EXTINF/i)) {
        var match = line.match(/^#EXTINF:[0-9]+,(.*)/i)
        if (match) {
          generator.add(new Track(this.spotify, match[1]))
          if (lines.length > 0 &&
              !lines[0].match(/^#/)) {
            lines.shift()
          }
        }
      } else if (line.match(/spotify:track:[0-9a-z]+/i)) {
        var uriMatch = line.match(/spotify:track:[0-9a-z]+/i)
        var uri = uriMatch[0]
        var uriTrack = new Track(this.spotify, uri)
        generator.add(uriTrack)
      } else if (line.match(/^https?:/i)) {
        var scraper = new WebScraper(line, this)
        generator.add(scraper)
      } else if (line) {
        var track = new Track(this.spotify, line)
        generator.add(track)
      }
    }
  }
  return generator
}

module.exports = Parser
