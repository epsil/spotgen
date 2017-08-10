var base64 = require('base-64')
var defaults = require('./defaults')
var http = require('./http')
var express = require('express')
var opn = require('opn')
var URI = require('urijs')

/**
 * Create a Spotify authentication handler.
 * @constructor
 * @param {string} [clientId] - Client ID.
 * @param {string} [clientKey] - Client secret key.
 * @param {string} [token] - Access token (if already authenticated).
 */
function SpotifyAuth (clientId, clientKey, token) {
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
SpotifyAuth.prototype.clientsCredentialsFlow = function (clientId, clientKey, grantType) {
  clientId = clientId || this.clientId
  clientKey = clientKey || this.clientKey
  grantType = grantType || 'client_credentials'
  var auth = 'Basic ' + base64.encode(clientId + ':' + clientKey)
  var uri = 'https://accounts.spotify.com/api/token'
  return http(uri, {
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
 * Authentication URI for the Implicit Grant Flow.
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
 * @param {string} [scopes] - A space-separated list of scopes.
 * @return {string} An authentication URI.
 */
SpotifyAuth.prototype.implicitGrantFlowURI = function (uri, clientId, scopes) {
  clientId = clientId || this.clientId
  var url = 'https://accounts.spotify.com/authorize'
  url += '/' +
    '?client_id=' + encodeURIComponent(clientId) +
    '&response_type=token' +
    '&redirect_uri=' + encodeURIComponent(uri)
  if (scopes) {
    url += '&scope' + encodeURIComponent(scopes)
  }
  return url
}

/**
 * Authenticate with the Implicit Grant Flow.
 *
 * Runs a temporary HTTP server at port 9000 and opens a Spotify login
 * page in a web browser. After the user has logged in, Spotify
 * redirects to the HTTP server with an access token (included in the
 * hash fragment of the URI). The token is picked up by the server and
 * returned by this function in a Promise.
 *
 * [Reference](https://developer.spotify.com/web-api/authorization-guide/#implicit-grant-flow).
 *
 * @param {string} [clientId] - Client ID.
 * @param {string} [scopes] - A space-separated list of scopes.
 * @param {string} [port] - Port number, default 9000.
 * Must be white-listed by Spotify.
 */
SpotifyAuth.prototype.implicitGrantFlow = function (clientId, scopes, port) {
  var self = this
  return new Promise(function (resolve, reject) {
    clientId = clientId || self.clientId
    port = port || 9000
    var localhost = 'http://localhost:' + port + '/'
    var login = self.implicitGrantFlowURI(localhost, clientId, scopes)
    var server = express()
    var http = server.listen(port)
    server.get('/', function (req, res) {
      var url = URI(req.url)
      if (url.query()) {
        http.close()
        req.connection.ref()
        req.connection.unref()
        self.token = url.search(true).access_token
        if (!self.token) {
          reject(self.token)
        } else {
          resolve(self.token)
        }
      } else {
        // the hash fragment is not part of a HTTP request,
        // so we convert it to a query string (which is!)
        // and perform a second request against our server
        var js = 'var hash = window.location.hash\n' +
            'if (hash) {\n' +
            'var url = \'/?\' + hash.replace(/^#/, \'\')\n' +
            'var http = new XMLHttpRequest()\n' +
            'http.open(\'GET\', url, true)\n' +
            'http.send(null)\n' +
            '}\n' +
            'setTimeout(window.close, 500)'
        var tag = '<script type="text/javascript">\n' + js + '\n</script>'
        res.send(tag)
      }
    })
    opn(login, function (err) {
      if (err) {
        http.close()
        reject(err)
      }
    })
  })
}

/**
 * Refresh the bearer access token.
 *
 * @return {Promise | string} A new bearer access token,
 * or the empty string if not available.
 */
SpotifyAuth.prototype.refreshToken = function () {
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
SpotifyAuth.prototype.getToken = function () {
  if (this.token) {
    return Promise.resolve(this.token)
  } else {
    return this.refreshToken()
  }
}

module.exports = SpotifyAuth
