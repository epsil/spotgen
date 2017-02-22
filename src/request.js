var request = require('request')

/**
 * Perform a HTTP request.
 * @param {string} url - The URL to look up.
 * @param {integer} [delay] - Time delay in ms.
 * @return {Promise} A promise.
 */
function doRequest (url, delay) {
  delay = delay || 100
  var requestPromise = function (url, delay) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        request(url, function (err, response, body) {
          if (err) {
            reject(err)
          } else if (response.statusCode !== 200) {
            reject(response.statusCode)
          } else {
            try {
              body = JSON.parse(body)
            } catch (e) {
              reject(e)
            }
            if (body.error) {
              reject(body)
            } else {
              resolve(body)
            }
          }
        })
      }, delay)
    })
  }
  return requestPromise(url, delay).catch(function (err) {
    // If the script is hosted on a HTTPS server, we cannot perform
    // HTTP requests because of the Same Origin Policy. Retry as a
    // HTTPS request.
    var message = err + ''
    if (message.match(/XHR error/i) &&
        url.match(/^http:/i)) {
      url = url.replace(/^http:/i, 'https:')
      return requestPromise(url, delay)
    }
  })
}

module.exports = doRequest
