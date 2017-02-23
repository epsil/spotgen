var request = require('request')

/**
 * Perform a HTTP request.
 * @param {string} url - The URL to look up.
 * @param {integer} [delay] - Time delay in ms.
 * @return {Promise} A promise.
 */
function http (url, delay) {
  delay = delay || 100
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      request(url, function (err, response, body) {
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
 * @param {string} url - The URL to look up.
 * @param {integer} [delay] - Time delay in ms.
 * @return {Promise} A promise.
 */
http.s = function (url, delay) {
  delay = delay || 100
  return http(url, delay).catch(function (err) {
    var message = err + ''
    if (message.match(/XHR error/i)) {
      if (url.match(/^http:/i)) {
        return http(url.replace(/^http:/i, 'https:'), delay)
      } else if (url.match(/^https:/i)) {
        return http(url.replace(/^https:/i, 'http:'), delay)
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
http.json = function (url, delay) {
  delay = delay || 100
  return http.s(url, delay).then(function (response) {
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
