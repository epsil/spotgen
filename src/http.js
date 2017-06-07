var request = require('request')
var querystring = require('querystring')

/**
 * Perform a HTTP request.
 * @param {string} uri - The URI to look up.
 * @param {Object} [options] - Request options.
 * @return {Promise} A promise.
 */
function http (uri, options) {
  options.uri = options.uri || uri
  options.delay = options.delay || 100
  options.method = options.method || 'GET'
  if (options.query) {
    options.query = querystring.stringify(options.query)
    if (options.method === 'GET') {
      options.uri += '?' + options.query
    } else {
      options.body = options.query
    }
  }
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      request(options, function (err, response, body) {
        if (err) {
          reject(err)
        } else if (response.statusCode !== 200) {
          reject(response.statusCode)
        } else {
          resolve(body)
        }
      })
    }, options.delay)
  })
}

/**
 * Perform a HTTP(S) request.
 *
 * If the script is hosted on a HTTPS server, we cannot perform
 * HTTP requests because of the Same Origin Policy. Therefore,
 * this function falls back to HTTPS if HTTP fails.
 *
 * @param {string} uri - The URI to look up.
 * @param {Object} [options] - Request options.
 * @return {Promise} A promise.
 */
http.s = function (uri, options) {
  return http(uri, options).catch(function (err) {
    var message = err + ''
    if (message.match(/XHR error/i)) {
      if (uri.match(/^http:/i)) {
        return http(uri.replace(/^http:/i, 'https:'), options)
      } else if (uri.match(/^https:/i)) {
        return http(uri.replace(/^https:/i, 'http:'), options)
      }
    }
  })
}

/**
 * Perform a HTTP JSON request.
 * @param {string} uri - The URI to look up.
 * @param {Object} [options] - Request options.
 * @return {Promise | JSON} A JSON response.
 */
http.json = function (uri, options) {
  return http.s(uri, options).then(function (response) {
    try {
      response = JSON.parse(response)
    } catch (e) {
      return Promise.reject(e)
    }
    if (response.error) {
      return Promise.reject(response)
    } else {
      return Promise.resolve(response)
    }
  })
}

module.exports = http
