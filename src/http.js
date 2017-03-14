var preq = require('preq')

/**
 * Perform a HTTP request.
 * @param {string} url - The URL to look up.
 * @param {integer} [delay] - Time delay in ms.
 * @return {Promise} A promise.
 */
function http (url, options) {
  options = options || {}
  options.uri = options.uri || url
  options.delay = options.delay || 100
  var delay = new Promise(function (resolve) {
    setTimeout(resolve, options.delay)
  })
  return delay.then(function () {
    return preq.get(options)
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
http.s = function (url, options) {
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

/**
 * Perform a HTTP JSON request.
 * @param {string} url - The URL to look up.
 * @param {integer} [delay] - Time delay in ms.
 * @return {Promise | JSON} A JSON response.
 */
http.json = function (url, options) {
  return http.s(url, options).then(function (res) {
    try {
      res = res.body
    } catch (e) {
      return Promise.reject(e)
    }
    if (res.error) {
      return Promise.reject(res)
    } else {
      return Promise.resolve(res)
    }
  })
}

module.exports = http
