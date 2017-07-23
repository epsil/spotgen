var eol = require('eol')
var Album = require('./album')
var CSV = require('./csv')
var Queue = require('./queue')
var SpotifyRequestHandler = require('./spotify')
var Track = require('./track')

/**
 * Create a playlist generator.
 * @constructor
 * @param {SpotifyRequestHandler} [spotify] - Spotify request handler.
 */
function Generator (spotify) {
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
   * Whether to reverse the playlist order.
   */
  this.reverse = false

  /**
   * Whether to shuffle the playlist.
   */
  this.shuffle = false

  /**
   * Whether to remove duplicates.
   */
  this.unique = true

  /**
   * Whether to remove duplicates.
   */
  this.spotify = spotify || new SpotifyRequestHandler()
}

/**
 * Add an entry to the end of the generator queue.
 * @param {Track | Album | Artist} entry -
 * The entry to add.
 */
Generator.prototype.add = function (entry) {
  this.entries.add(entry)
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
  } else {
    return Promise.resolve(this.entries)
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
  return Promise.resolve(this.entries)
}

/**
 * Dispatch all the entries in the generator.
 * @return {Promise | Queue} A queue of results.
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
    return self.reorder()
  })
}

/**
 * Dispatch all the entries in the generator
 * and return the track listing.
 * @return {Promise | string} A newline-separated list
 * of Spotify URIs.
 */
Generator.prototype.execute = function () {
  var self = this
  return this.dispatch().then(function () {
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
    return self.entries
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
  } else {
    return Promise.resolve(this.entries)
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
  } else {
    return Promise.resolve(this.entries)
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
 * Reverse the order of the entries.
 * @return {Promise|Generator} - Itself.
 */
Generator.prototype.reorder = function () {
  if (this.reverse) {
    return this.entries.reverse()
  } else if (this.shuffle) {
    return this.entries.shuffle()
  }
  return Promise.resolve(this.entries)
}

/**
 * Convert the generator to a string.
 * @return {string} A newline-separated list of Spotify URIs.
 */
Generator.prototype.toString = function () {
  var self = this
  var result = ''
  if (self.csv) {
    result += 'sep=,\n'
  }
  this.entries.forEach(function (entry) {
    if (entry instanceof Track || entry instanceof Album) {
      if (entry instanceof Track) {
        var log = entry.title
        if (entry.popularity || entry.lastfm) {
          log += ' ('
          log += entry.popularity ? ('Spotify popularity: ' + entry.popularity) : ''
          log += (entry.popularity && entry.lastfm) ? ', ' : ''
          log += entry.lastfm ? 'Last.fm rating: ' + entry.lastfm : ''
          log += ')'
        }
        console.log(log)
      }
      if (self.csv) {
        var csvFormat = new CSV(entry)
        var csvLine = csvFormat.toString()
        result += csvLine + '\n'
      } else {
        if (entry.uri) {
          result += entry.uri + '\n'
        }
      }
    }
  })
  result = eol.auto(result.trim())
  return result
}

module.exports = Generator
