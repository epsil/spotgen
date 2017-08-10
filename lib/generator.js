var defaults = require('./defaults')
var Parser = require('./parser')
var SpotifyWebApi = require('./spotify')

/**
 * Create a playlist generator.
 * @constructor
 * @param {string} [str] - A newline-separated string of
 * entries on the form `title - artist`. May also contain
 * `#album`, `#artist`, `#order` and `#group` commands.
 * @param {string} [clientId] - Client ID.
 * @param {string} [clientKey] - Client secret key.
 * @param {string} [token] - Access token (if already authenticated).
 */
function Generator (str, clientId, clientKey, token) {
  /**
   * Output format.
   * May be `csv`, `list`, `log` or `uri`.
   */
  this.format = ''

  /**
   * Spotify web API.
   */
  this.spotify = new SpotifyWebApi(clientId || defaults.id,
                                   clientKey || defaults.key,
                                   token)

  /**
   * String parser.
   */
  this.parser = new Parser(null, this.spotify)

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
  var self = this
  this.format = format || this.format
  return this.collection.execute(this.format).then(function (result) {
    self.format = self.collection.format
    return result
  })
}

module.exports = Generator
