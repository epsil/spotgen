var request = require('request')

/**
 * Perform a HTTP request.
 * @param {string} uri - The URI to look up.
 * @param {Object} [options] - Request options.
 * @return {Promise} A promise.
 */
function http (uri, options) {
  var delay = options.delay || 100
  options.uri = options.uri || uri
  options.method = options.method || 'GET'
  delete options.delay
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
    }, delay)
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
