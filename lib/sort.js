var stringSimilarity = require('string-similarity')

var sort = {}

/**
 * Create an ascending comparison function.
 * @param {function} fn - A scoring function.
 * @return {function} - A comparison function that returns
 * `-1` if the first argument scores less than the second argument,
 * `1` if the first argument scores more than the second argument,
 * and `0` if the scores are equal.
 */
sort.ascending = function (fn) {
  return function (a, b) {
    var x = fn(a)
    var y = fn(b)
    return (x < y) ? -1 : ((x > y) ? 1 : 0)
  }
}

/**
 * Create a descending comparison function.
 * @param {function} fn - A scoring function.
 * @return {function} - A comparison function that returns
 * `-1` if the first argument scores more than the second argument,
 * `1` if the first argument scores less than the second argument,
 * and `0` if the scores are equal.
 */
sort.descending = function (fn) {
  return function (a, b) {
    var x = fn(a)
    var y = fn(b)
    return (x < y) ? 1 : ((x > y) ? -1 : 0)
  }
}

/**
 * Combine comparison functions.
 * @param {...function} fn - A comparison function.
 * @return {function} - A combined comparison function that returns
 * the first comparison value unless the comparands are equal,
 * in which case it returns the next value.
 */
sort.combine = function () {
  var args = Array.prototype.slice.call(arguments)
  var callback = function (fn1, fn2) {
    return function (a, b) {
      var val = fn1(a, b)
      return (val === 0) ? fn2(a, b) : val
    }
  }
  return args.reduce(callback)
}

/**
 * Compare albums by type. Proper albums are ranked highest,
 * followed by singles, guest albums, and compilation albums.
 * @param {JSON} a - An album.
 * @param {JSON} b - An album.
 * @return {integer} - `-1` if `a` is less than `b`,
 * `1` if `a` is greater than `b`,
 * and `0` if `a` is equal to `b`.
 */
sort.album = sort.combine(sort.descending(function (album) {
  var rankings = {
    'album': 4,
    'single': 3,
    'appears_on': 2,
    'compilation': 1
  }
  var type = album.album_type || album.type()
  return rankings[type] || 0
}), sort.descending(function (album) {
  var popularity = album.popularity
  if (typeof popularity === 'function') {
    return popularity()
  } else {
    return popularity || -1
  }
}))

/**
 * Compare tracks by Last.fm rating.
 * @param {Track} a - A track.
 * @param {Track} b - A track.
 * @return {integer} - `1` if `a` is less than `b`,
 * `-1` if `a` is greater than `b`,
 * and `0` if `a` is equal to `b`.
 */
sort.lastfm = sort.descending(function (track) {
  return track.lastfm()
})

/**
 * Compare tracks by Spotify popularity.
 * @param {Track} a - A track.
 * @param {Track} b - A track.
 * @return {integer} - `1` if `a` is less than `b`,
 * `-1` if `a` is greater than `b`,
 * and `0` if `a` is equal to `b`.
 */
sort.popularity = sort.descending(function (track) {
  return track.popularity()
})

/**
 * Sort track objects by similarity to a track.
 * @param {string} track - The track to compare against.
 * @return {function} - A comparison function.
 */
sort.similar = function (track) {
  var similarity = sort.descending(function (x) {
    var title = x.name + ' - ' + (x.artists[0].name || '')
    return stringSimilarity.compareTwoStrings(title, track)
  })
  var popularity = sort.descending(function (x) {
    return x.popularity || -1
  })
  var explicit = sort.descending(function (x) {
    return x.explicit ? 1 : 0
  })
  return sort.combine(similarity, popularity, explicit)
}

module.exports = sort
