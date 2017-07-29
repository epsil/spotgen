var Parser = require('./parser')
var SpotifyRequestHandler = require('./spotify')

/**
 * Create a playlist generator.
 * @constructor
 * @param {string} [str] - A newline-separated string of
 * entries on the form `TITLE - ARTIST`. May also contain
 * `#ALBUM`, `#ARTIST`, `#ORDER` and `#GROUP` commands.
 * @param {string} [token] - Access token (if already authenticated).
 * @param {string} [clientId] - Client ID.
 * @param {string} [clientSecret] - Client secret key.
 */
function Generator (str, token, clientId, clientSecret) {
  /**
   * Spotify request handler.
   */
  this.handler = new SpotifyRequestHandler(clientId, clientSecret, token)

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
 * @return {Promise | string} A newline-separated list
 * of Spotify URIs.
 */
Generator.prototype.generate = function () {
  return this.collection.execute()
}

module.exports = Generator
