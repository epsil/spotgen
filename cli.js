var request = require('request')

request('http://www.sitepoint.com', function (error, response, body) {
  if (error) {
    console.log('error')
    return
  }

  console.log(body)
})
