var base64 = require('base-64')
var defaults = require('./defaults')
var http = require('./http')

/**
 * Create a Spotify authenticator.
 * @constructor
 * @param {string} [clientId] - Client ID.
 * @param {string} [clientKey] - Client secret key.
 * @param {string} [token] - Access token (if already authenticated).
 */
function SpotifyAuthenticator (clientId, clientKey, token) {
  /**
   * Client ID.
   */
  this.clientId = clientId || defaults.id

  /**
   * Client secret key.
   */
  this.clientKey = clientKey || defaults.key

  /**
   * Access token.
   */
  this.token = token || ''
}

/**
 * Authenticate with the Clients Credentials Flow.
 *
 * Note: this authentication method only works if the script is run
 * from the command line. It does not work when run from a browser,
 * because Spotify's authentication server rejects cross-site
 * requests. In that case, authenticate with the Implicit Grant Flow
 * instead.
 *
 * [Reference](https://developer.spotify.com/web-api/authorization-guide/#client-credentials-flow).
 *
 * @param {string} clientId - Client ID.
 * @param {string} clientKey - Client secret key.
 * @param {string} [grantType] - Grant type, default "client_credentials".
 * @return {Promise | JSON} An access token response.
 */
SpotifyAuthenticator.prototype.clientsCredentialsFlow = function (clientId, clientKey, grantType) {
  clientId = clientId || this.clientId
  clientKey = clientKey || this.clientKey
  grantType = grantType || 'client_credentials'
  var auth = 'Basic ' + base64.encode(clientId + ':' + clientKey)
  var uri = 'https://accounts.spotify.com/api/token'
  return http.json(uri, {
    method: 'POST',
    headers: {
      Authorization: auth
    },
    form: {
      'grant_type': grantType
    }
  })
}

/**
 * Authenticate with the Implicit Grant Flow.
 *
 * Returns a URI that the calling web application can use to redirect
 * the user to a Spotify login screen. After the user has logged in,
 * Spotify redirects back to the web application with an access token
 * (included in the hash fragment of the URI). That token can then be
 * passed to this class.
 *
 * [Reference](https://developer.spotify.com/web-api/authorization-guide/#implicit-grant-flow).
 *
 * @param {string} uri - Redirect URI.
 * @param {string} [clientId] - Client ID.
 * @return {string} An authentication URI.
 */
SpotifyAuthenticator.prototype.implicitGrantFlow = function (uri, clientId) {
  clientId = clientId || this.clientId
  var url = 'https://accounts.spotify.com/authorize'
  url += '/' +
    '?client_id=' + encodeURIComponent(clientId) +
    '&response_type=' + encodeURIComponent('token') +
    '&redirect_uri=' + encodeURIComponent(uri)
  return url
}

/**
 * Refresh the bearer access token.
 *
 * @return {Promise | string} A new bearer access token,
 * or the empty string if not available.
 */
SpotifyAuthenticator.prototype.refreshToken = function () {
  return this.clientsCredentialsFlow().then(function (response) {
    if (response &&
        response.access_token) {
      this.token = response.access_token
    }
    return this.token
  })
}

/**
 * Obtain a bearer access token.
 *
 * @return {Promise | string} A bearer access token,
 * or the empty string if not available.
 */
SpotifyAuthenticator.prototype.getToken = function () {
  if (this.token) {
    return Promise.resolve(this.token)
  } else {
    return this.refreshToken()
  }
}

module.exports = SpotifyAuthenticator
