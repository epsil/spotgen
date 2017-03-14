# preq [![Build Status](https://travis-ci.org/wikimedia/preq.svg?branch=master)](https://travis-ci.org/wikimedia/preq)

Yet another promising [request](https://github.com/request/request) wrapper.

## Features
- ES6 `Promise`-based, using the excellent
    [bluebird](https://github.com/petkaantonov/bluebird/blob/master/API.md) by
    default
- Robustness: retry, timeout and connect timeout support
- Proper error handling: All errors (incl. HTTP responses with code >= 400)
    throw exceptions, and can be caught with `Promise.catch()`. This ensures
    that all errors are handled, and often cleans up the code by clearly
    separating out error handling. The `HTTPError` instance has all the
    properties of a normal response.

## Installation
```
npm install preq
```

## Usage
```javascript
var preq = require('preq');

return preq.get({                   // or preq.request({ method: 'get', .. })
    uri: 'http://google.com/',
    headers: {
        'x-foo': 'bar'
    },
    query: {
        q: 'foo'
    },
    // body for POSTs or PUTs, can be object (serialized to JSON), Buffer or String
})
.then(function(res) {
    /**
     * { 
     *   status: 200,
     *   headers: { 
     *     date: 'Sat, 21 Feb 2015 01:47:40 GMT' // , ...
     *   },
     *   body: '<!doctype html>...</html>' // or object if json
     * }
     */
})
.catch(function(err) {
    // Any response with HTTP status >= 400
    // err is HTTPError with same properties as response above
});
```


## `preq`-specific parameters / methods
`preq` passes through most options directly to
[request](https://github.com/request/request), so see its documentation for
advanced options.

Additionally, it defines or modifies these request options:

- `method`: Lowercase HTTP verbs. Automatically set by the verb methods (`preq.get()`,
    `.post()` etc).
- `uri`: use `uri`, *not* `url`.
- `query`: query string parameters
- `body`: `String`, `Buffer` or `Object`. If an object is supplied, the
    serialization depends on the `content-type` header. Supported:
    - `application/json.*`
    - `multipart/form-data`
    - `application/x-www-form-urlencoded`
- `retries`: Maximum number of retries. Exponential back-off is used between retries.
- `timeout`: Total request timeout. 

The connection timeout, maximum time to establish a TCP connection to the host is 5 seconds by default
and can be altered with `PREQ_CONNECT_TIMEOUT` environment variable.


Also see [the tests](/test/index.js) for usage examples.
