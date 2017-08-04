var defaults = require('./defaults')
var Parser = require('./parser')
var SpotifyWebApi = require('spotify-web-api-node')

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
   * Spotify web API.
   */
  this.handler = new SpotifyWebApi({
    clientId: defaults.id,
    clientSecret: defaults.key,
    redirectUri: 'https://epsil.github.io/spotgen/'
  })
  // this.handler = new SpotifyRequestHandler(clientId, clientKey, token)

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
  var self = this
  // TODO: use pre-existing token
  return this.handler.clientCredentialsGrant().then(function (data) {
    // console.log('The access token expires in ' + data.body['expires_in'])
    // console.log('The access token is ' + data.body['access_token'])
    // save the access token so that it's used in future calls
    self.handler.setAccessToken(data.body.access_token)
    return self.collection.execute(format)
  })
}

module.exports = Generator
