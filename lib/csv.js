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
  return stringify([[
    this.track.uri(),
    this.track.title(),
    this.track.artist(),
    this.track.album(),
    this.orEmptyString(this.track.discNumber()),
    this.orEmptyString(this.track.trackNumber()),
    this.orEmptyString(this.track.duration()),
    this.orEmptyString(this.track.popularity()),
    this.orEmptyString(this.track.lastfm())
  ]]).trim()
}

module.exports = CSV
