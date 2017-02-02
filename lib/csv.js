/**
 * Create track entry.
 * @constructor
 * @param {string} entry - The track to search for.
 * @param {JSON} [response] - Track response object.
 * Should have the property `popularity`.
 * @param {JSON} [responseSimple] - Simplified track response object.
 */
function CSV (track) {
  /**
   * Track.
   */
  this.track = track
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
  var discNumber = this.track.discNumber()
  var trackNumber = this.track.trackNumber()
  var duration = this.track.duration()
  var addedBy = ''
  var addedAt = ''
  var result = uri + ',' +
      title + ',' +
      artist + ',' +
      album + ',' +
      discNumber + ',' +
      trackNumber + ',' +
      duration + ',' +
      addedBy + ',' +
      addedAt
  return result
}

module.exports = CSV
