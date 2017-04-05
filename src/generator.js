var eol = require('eol')
var Album = require('./album')
var CSV = require('./csv')
var Queue = require('./queue')
var Track = require('./track')

/**
 * Create a generator.
 * @constructor
 * @param {string} str - A newline-separated string of
 * entries on the form `TITLE - ARTIST`. May also contain
 * `#ALBUM`, `#ARTIST`, `#ORDER` and `#GROUP` directives.
 */
function Generator () {
  /**
   * Playlist alternating.
   */
  this.alternating = null

  /**
   * Whether to output as CSV.
   */
  this.csv = false

  /**
   * List of entries.
   */
  this.entries = new Queue()

  /**
   * Playlist grouping.
   */
  this.grouping = null

  /**
   * Last.fm user.
   */
  this.lastfmUser = null

  /**
   * Playlist order.
   */
  this.ordering = null

  /**
   * Whether to remove duplicates.
   */
  this.unique = true
}

/**
 * Alternate the generator entries.
 */
Generator.prototype.alternate = function () {
  var self = this
  if (this.alternating === 'artist') {
    return this.entries.alternate(function (track) {
      return track.artist().toLowerCase()
    })
  } else if (this.alternating === 'album') {
    return this.refreshTracks().then(function () {
      return self.entries.alternate(function (track) {
        return track.album().toLowerCase()
      })
    })
  } else if (this.alternating === 'entry') {
    return this.entries.alternate(function (track) {
      return track.entry.toLowerCase()
    })
  }
}

/**
 * Remove duplicate entries.
 * @return {Promise|Generator} - Itself.
 */
Generator.prototype.dedup = function () {
  if (this.unique) {
    return this.entries.dedup()
  }
  return Promise.resolve(this)
}

/**
 * Dispatch all the entries in the generator
 * and return the track listing.
 * @return {Promise | string} A newline-separated list
 * of Spotify URIs.
 */
Generator.prototype.dispatch = function () {
  var self = this
  return this.fetchTracks().then(function () {
    return self.dedup()
  }).then(function () {
    return self.order()
  }).then(function () {
    return self.group()
  }).then(function () {
    return self.alternate()
  }).then(function () {
    return self.toString()
  })
}

/**
 * Fetch Last.fm metadata of each generator entry.
 * @return {Promise | Queue} A queue of results.
 */
Generator.prototype.fetchLastfm = function () {
  var self = this
  return this.entries.forEachPromise(function (entry) {
    return entry.fetchLastfm(self.lastfmUser)
  })
}

/**
 * Dispatch the entries in the generator.
 * @return {Promise} A Promise to perform the action.
 */
Generator.prototype.fetchTracks = function () {
  var self = this
  return this.entries.dispatch().then(function (queue) {
    self.entries = queue.flatten()
  })
}

/**
 * Group the generator entries.
 */
Generator.prototype.group = function () {
  var self = this
  if (this.grouping === 'artist') {
    return this.entries.group(function (track) {
      return track.artist().toLowerCase()
    })
  } else if (this.grouping === 'album') {
    return this.refreshTracks().then(function () {
      return self.entries.group(function (track) {
        return track.album().toLowerCase()
      })
    })
  } else if (this.grouping === 'entry') {
    return this.entries.group(function (track) {
      return track.entry.toLowerCase()
    })
  }
}

/**
 * Order the generator entries.
 * @return {Promise} A Promise to perform the action.
 */
Generator.prototype.order = function () {
  var self = this
  if (this.ordering === 'popularity') {
    return this.refreshTracks().then(function () {
      self.entries.orderByPopularity()
    })
  } else if (this.ordering === 'lastfm') {
    return this.fetchLastfm().then(function () {
      self.entries.orderByLastfm()
    })
  }
}

/**
 * Print the generator to the console.
 */
Generator.prototype.print = function () {
  console.log(this.toString())
}

/**
 * Refresh the metadata of each generator entry.
 * @return {Promise} A Promise to perform the action.
 */
Generator.prototype.refreshTracks = function () {
  var self = this
  return this.entries.dispatch().then(function (result) {
    self.entries = result.flatten()
  })
}

/**
 * Convert the generator to a string.
 * @return {string} A newline-separated list of Spotify URIs.
 */
Generator.prototype.toString = function () {
  var self = this
  var result = self.csv ? 'sep=,\n' : ''
  this.entries.forEach(function (entry) {
    if (entry instanceof Track || entry instanceof Album) {
      if (entry instanceof Track) {
        console.log(entry.toString())
        console.log(entry.popularity() + ' (' + entry.lastfm() + ')')
      }
      if (self.csv) {
        var csvFormat = new CSV(entry)
        var csvLine = csvFormat.toString()
        result += csvLine + '\n'
      } else {
        var uri = entry.uri()
        if (uri !== '') {
          result += uri + '\n'
        }
      }
    }
  })
  result = eol.auto(result.trim())
  return result
}

module.exports = Generator
