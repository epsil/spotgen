var preq = require('preq')

/**
 * Perform a HTTP request.
 * @param {string} url - The URL to look up.
 * @param {integer} [delay] - Time delay in ms.
 * @return {Promise} A promise.
 */
function http (url, options) {
  options = options || {}
  options.uri = url || options.uri
  options.delay = options.delay || 100
  options.retries = options.retries || 5
  var delay = function (time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time)
    })
  }
  return delay(options.delay).then(function () {
    return preq.get(options)
  }).then(function (res) {
    return res.body
  })
}

/**
 * Perform a HTTP(S) request.
 *
 * If the script is hosted on a HTTPS server, we cannot perform
 * HTTP requests because of the Same Origin Policy. Therefore,
 * this function falls back to HTTPS if HTTP fails.
 *
 * @param {string} url - The URL to look up.
 * @param {integer} [delay] - Time delay in ms.
 * @return {Promise} A promise.
 */
http.json = function (url, options) {
  return http(url, options).catch(function (err) {
    var message = err + ''
    if (message.match(/XHR error/i)) {
      if (url.match(/^http:/i)) {
        return http(url.replace(/^http:/i, 'https:'), options)
      } else if (url.match(/^https:/i)) {
        return http(url.replace(/^https:/i, 'http:'), options)
      }
    }
  })
}

module.exports = http
