var stringify = require('csv-stringify/lib/sync')

/**
 * Create CSV formatter.
 * @constructor
 * @param {track} track - A track with fetched metadata.
 */
function CSV (track) {
  /**
   * A track with fetched metadata.
   */
  this.track = track
}

/**
 * Return empty string if less than zero.
 * @param {integer} num - The value.
 * @return {string | integer} The empty string if `num` is less than zero,
 * or `num` otherwise.
 */
CSV.prototype.orEmptyString = function (num) {
  return (num < 0) ? '' : num
}

/**
 * Track data in CSV format, with the following fields:
 *
 * Spotify URI,
 * Track Name,
 * Artist Name,
 * Album Name,
 * Disc Number,
 * Track Number,
 * Track Duration,
 * Added By,
 * Added At
 *
 * @return {string} Track data in CSV format.
 */
CSV.prototype.toString = function () {
  var uri = this.track.uri()
  var title = this.track.title()
  var artist = this.track.artist()
  var album = this.track.album()
  var discNumber = this.orEmptyString(this.track.discNumber())
  var trackNumber = this.orEmptyString(this.track.trackNumber())
  var duration = this.orEmptyString(this.track.duration())
  var popularity = this.orEmptyString(this.track.popularity())
  var lastfm = this.orEmptyString(this.track.lastfm())
  var result = stringify([[uri, title, artist, album, discNumber, trackNumber, duration, popularity, lastfm]])
  return result.trim()
}

module.exports = CSV
