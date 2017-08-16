var stringSimilarity = require('string-similarity')
var _ = require('lodash')

/**
 * Stable sort, preserving the original order when possible.
 * @param {Array} arr - The array to sort.
 * @param {function} [fn] - A comparison function that returns
 * `-1` if the first argument scores less than the second argument,
 * `1` if the first argument scores more than the second argument,
 * and `0` if the scores are equal.
 * @return {Array} - The array, sorted.
 */
function sort (arr, fn) {
  fn = fn || sort.ascending()
  var i = 0
  var pairs = arr.map(function (x) {
    return {
      idx: i++,
      val: x
    }
  })
  pairs = pairs.sort(function (a, b) {
    var x = fn(a.val, b.val)
    if (x) { return x }
    return (a.idx < b.idx) ? -1 : ((a.idx > b.idx) ? 1 : 0)
  })
  for (i = 0; i < arr.length; i++) {
    arr[i] = pairs[i].val
  }
  return arr
}

/**
 * Create an ascending comparison function.
 * @param {function} fn - A scoring function.
 * @return {function} - A comparison function that returns
 * `-1` if the first argument scores less than the second argument,
 * `1` if the first argument scores more than the second argument,
 * and `0` if the scores are equal.
 */
sort.ascending = function (fn) {
  return sort.comparator(function (x, y) {
    return (x < y) ? -1 : ((x > y) ? 1 : 0)
  }, fn)
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
  return sort.comparator(function (x, y) {
    return (x < y) ? 1 : ((x > y) ? -1 : 0)
  }, fn)
}

/**
 * Create a comparison function.
 * @param {function} cmp - A comparator function.
 * @param {function} [fn] - A scoring function.
 * @return {function} - A comparison function that returns
 * `-1`, `1` or `0` depending on its arguments' scoring values
 * and the intended order.
 */
sort.comparator = function (cmp, fn) {
  fn = fn || _.identity
  return function (a, b) {
    return cmp(fn(a), fn(b))
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
  return args.reduce(function (fn1, fn2) {
    return function (a, b) {
      var val = fn1(a, b)
      return (val === 0) ? fn2(a, b) : val
    }
  })
}

/**
 * Compare tracks by Spotify popularity.
 * @param {Track} a - A track.
 * @param {Track} b - A track.
 * @return {integer} - `1` if `a` is less than `b`,
 * `-1` if `a` is greater than `b`,
 * and `0` if `a` is equal to `b`.
 */
sort.popularity = sort.descending(function (x) {
  return x.popularity || -1
})

/**
 * Compare tracks by Last.fm rating.
 * @param {Track} a - A track.
 * @param {Track} b - A track.
 * @return {integer} - `1` if `a` is less than `b`,
 * `-1` if `a` is greater than `b`,
 * and `0` if `a` is equal to `b`.
 */
sort.lastfm = sort.combine(sort.descending(function (x) {
  return x.lastfmPersonal || -1
}), sort.descending(function (x) {
  return x.lastfmGlobal || -1
}), sort.popularity)

/**
 * Compare albums by type. Proper albums are ranked highest,
 * followed by singles, guest albums, and compilation albums.
 * @param {JSON} a - An album.
 * @param {JSON} b - An album.
 * @return {integer} - `-1` if `a` is less than `b`,
 * `1` if `a` is greater than `b`,
 * and `0` if `a` is equal to `b`.
 */
sort.type = sort.descending(function (album) {
  var rankings = {
    'album': 4,
    'single': 3,
    'appears_on': 2,
    'compilation': 1
  }
  var type = album.album_type
  return rankings[type] || 0
})

/**
 * Compare albums by type and popularity.
 * @param {JSON} a - An album.
 * @param {JSON} b - An album.
 * @return {integer} - `-1` if `a` is less than `b`,
 * `1` if `a` is greater than `b`,
 * and `0` if `a` is equal to `b`.
 */
sort.album = sort.combine(sort.type, sort.popularity)

/**
 * Sort objects by similarity to a string.
 * @param {function} fn - A function returning the object's name
 * as a string.
 * @param {string} str - The string to compare against.
 * @return {function} - A comparison function.
 */
sort.similarity = function (fn, str) {
  return sort.descending(function (x) {
    return stringSimilarity.compareTwoStrings(fn(x), str)
  })
}

/**
 * Sort album objects by similarity to a string.
 * @param {string} album - The string to compare against.
 * @return {function} - A comparison function.
 */
sort.similarAlbum = function (album) {
  return sort.similarity(function (x) {
    return (x.artists[0].name || '') + ' - ' + x.name
  }, album)
}

/**
 * Sort artist objects by similarity to a string.
 * @param {string} artist - The string to compare against.
 * @return {function} - A comparison function.
 */
sort.similarArtist = function (artist) {
  return sort.similarity(function (x) {
    return x.name
  }, artist)
}

/**
 * Sort track objects by similarity to a string.
 * @param {string} track - The string to compare against.
 * @return {function} - A comparison function.
 */
sort.similarTrack = function (track) {
  return sort.similarity(function (x) {
    return (x.artists[0].name || '') + ' - ' + x.name
  }, track)
}

/**
 * Sort track objects by censorship.
 * Explicit tracks are preferred over censored ones.
 * @param {Track} a - A track.
 * @param {Track} b - A track.
 * @return {integer} - `1` if `a` is less than `b`,
 * `-1` if `a` is greater than `b`,
 * and `0` if `a` is equal to `b`.
 */
sort.censorship = sort.descending(function (x) {
  return x.explicit ? 1 : 0
})

/**
 * Sort track objects by similarity to a track,
 * popularity, and censorship.
 * @param {string} track - The track to compare against.
 * @return {function} - A comparison function.
 */
sort.track = function (track) {
  return sort.combine(sort.similarTrack(track),
                      sort.popularity,
                      sort.censorship)
}

module.exports = sort
