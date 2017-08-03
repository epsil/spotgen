var Parser = require('./parser')
var SpotifyRequestHandler = require('./spotify')

/**
 * Create a playlist generator.
 * @constructor
 * @param {string} [str] - A newline-separated string of
 * entries on the form `TITLE - ARTIST`. May also contain
 * `#ALBUM`, `#ARTIST`, `#ORDER` and `#GROUP` commands.
 * @param {string} [clientId] - Client ID.
 * @param {string} [clientKey] - Client secret key.
 * @param {string} [token] - Access token (if already authenticated).
 */
function Generator (str, clientId, clientKey, token) {
  /**
   * Spotify request handler.
   */
  this.handler = new SpotifyRequestHandler(clientId, clientKey, token)

  /**
   * String parser.
   */
  this.parser = new Parser(null, this.handler)

  /**
   * Playlist collection.
   */
  this.collection = this.parser.parse(str)
}

/**
 * Generate a playlist.
 * @param {string} [format] - The output format.
 * May be `csv`, `list`, `log` or `uri` (the default).
 * @return {Promise | string} A newline-separated list
 * of Spotify URIs.
 */
Generator.prototype.generate = function (format) {
  return this.collection.execute(format)
}

module.exports = Generator
