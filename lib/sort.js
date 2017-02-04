var stringSimilarity = require('string-similarity')

var sort = {}

/**
 * Compare albums by type. Proper albums are ranked highest,
 * followed by singles, guest albums, and compilation albums.
 * @param {JSON} a - An album.
 * @param {JSON} b - An album.
 * @return {integer} - `-1` if `a` is less than `b`,
 * `1` if `a` is greater than `b`,
 * and `0` if `a` is equal to `b`.
 */
sort.album = function (a, b) {
  var rank = function (album) {
    var rankings = {
      'album': 1,
      'single': 2,
      'appears_on': 3,
      'compilation': 4
    }
    return rankings[album.album_type] || 5
  }

  var x = rank(a)
  var y = rank(b)
  var val = (x < y) ? -1 : ((x > y) ? 1 : 0)
  return val
}

/**
 * Combine two comparator functions.
 * @param {function} fn1 - The main comparator function.
 * @param {function} fn2 - The fall-back comparator function.
 * @return {function} - A comparator that returns the comparison value
 * of `fn1` unless the comparands are equal, in which case it
 * returns the comparison value of `fn2`.
 */
sort.combine = function (fn1, fn2) {
  return function (a, b) {
    var val = fn1(a, b)
    return (val === 0) ? fn2(a, b) : val
  }
}

/**
 * Compare tracks by Last.fm rating.
 * @param {Track} a - A track.
 * @param {Track} b - A track.
 * @return {integer} - `1` if `a` is less than `b`,
 * `-1` if `a` is greater than `b`,
 * and `0` if `a` is equal to `b`.
 */
sort.lastfm = function (a, b) {
  var x = a.lastfm()
  var y = b.lastfm()
  var val = (x < y) ? 1 : ((x > y) ? -1 : 0)
  return val
}

/**
 * Compare tracks by Spotify popularity.
 * @param {Track} a - A track.
 * @param {Track} b - A track.
 * @return {integer} - `1` if `a` is less than `b`,
 * `-1` if `a` is greater than `b`,
 * and `0` if `a` is equal to `b`.
 */
sort.popularity = function (a, b) {
  var x = a.popularity()
  var y = b.popularity()
  var val = (x < y) ? 1 : ((x > y) ? -1 : 0)
  return val
}

/**
 * Sort tracks by string similarity.
 * @param {Track} a - A track.
 * @param {Track} b - A track.
 * @return {integer} - `1` if `a` is less than `b`,
 * `-1` if `a` is greater than `b`,
 * and `0` if `a` is equal to `b`.
 */
sort.similar = function (track) {
  return function (a, b) {
    var aname = a.name + ' - ' + (a.artists[0].name || '')
    var bname = b.name + ' - ' + (b.artists[0].name || '')
    var x = stringSimilarity.compareTwoStrings(aname, track)
    var y = stringSimilarity.compareTwoStrings(bname, track)
    var val = (x < y) ? 1 : ((x > y) ? -1 : 0)
    return val
  }
}

module.exports = sort
