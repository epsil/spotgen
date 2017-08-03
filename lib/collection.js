var Album = require('./album')
var CSV = require('./csv')
var Queue = require('./queue')
var SpotifyRequestHandler = require('./spotify')
var Track = require('./track')

/**
 * Create a playlist collection.
 * @constructor
 * @param {SpotifyRequestHandler} [spotify] - Spotify request handler.
 */
function Collection (spotify) {
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
   * Spotify request handler.
   */
  this.spotify = spotify || new SpotifyRequestHandler()
}

/**
 * Add an entry to the end of the collection queue.
 * @param {Track | Album | Artist} entry -
 * The entry to add.
 */
Collection.prototype.add = function (entry) {
  this.entries.add(entry)
}

/**
 * Alternate the collection entries.
 */
Collection.prototype.alternate = function () {
  var self = this
  if (this.alternating === 'artist') {
    return this.entries.alternate(function (track) {
      return track.mainArtist.toLowerCase()
    })
  } else if (this.alternating === 'album') {
    return this.getTrackInfo().then(function () {
      return self.entries.alternate(function (track) {
        return track.album.toLowerCase()
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
 * @return {Promise | Collection} - Itself.
 */
Collection.prototype.dedup = function () {
  if (this.unique) {
    return this.entries.dedup()
  }
  return Promise.resolve(this.entries)
}

/**
 * Dispatch all the entries in the collection.
 * @return {Promise | Queue} A queue of results.
 */
Collection.prototype.dispatch = function () {
  var self = this
  return this.getTracks().then(function () {
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
 * Dispatch all the entries in the collection
 * and return the track listing.
 * @param {string} [format] - The output format.
 * May be `csv`, `list`, `log` or `uri` (the default).
 * @return {Promise | string} A newline-separated list
 * of Spotify URIs.
 */
Collection.prototype.execute = function (format) {
  var self = this
  return this.dispatch().then(function () {
    return self.toString(format)
  })
}

/**
 * Iterate over the collection's entries.
 * @param {Function} fn - An iterator function.
 * Takes the current entry as input.
 */
Collection.prototype.forEach = function (fn) {
  return this.entries.forEach(fn)
}

/**
 * Iterate over the collection's valid entries.
 * @param {Function} fn - An iterator function.
 * Takes the current entry as input.
 */
Collection.prototype.forEachEntry = function (fn) {
  return this.forEach(function (entry) {
    if ((entry instanceof Track || entry instanceof Album) &&
        entry.uri) {
      return fn(entry)
    }
  })
}

/**
 * Iterate over the collection's valid track.
 * @param {Function} fn - An iterator function.
 * Takes the current entry as input.
 */
Collection.prototype.forEachTrack = function (fn) {
  return this.forEach(function (entry) {
    if (entry instanceof Track && entry.uri) {
      return fn(entry)
    }
  })
}

/**
 * Fetch Last.fm metadata of each collection entry.
 * @return {Promise | Queue} A queue of results.
 */
Collection.prototype.getLastfm = function () {
  var self = this
  return this.entries.forEachPromise(function (entry) {
    return entry.getLastfm(self.lastfmUser)
  })
}

/**
 * Fetch Spotify popularity of each collection entry.
 * @return {Promise | Queue} A queue of results.
 */
Collection.prototype.getPopularity = function () {
  return this.entries.forEachPromise(function (entry) {
    return entry.getPopularity()
  })
}

/**
 * Refresh the metadata of each collection entry.
 * @return {Promise} A Promise to perform the action.
 */
Collection.prototype.getTrackInfo = function () {
  return this.entries.forEachPromise(function (entry) {
    return entry.getInfo()
  })
}

/**
 * Dispatch the entries in the collection.
 * @return {Promise} A Promise to perform the action.
 */
Collection.prototype.getTracks = function () {
  var self = this
  return this.entries.dispatch().then(function (queue) {
    self.entries = queue.flatten()
    return self.entries
  })
}

/**
 * Group the collection entries.
 */
Collection.prototype.group = function () {
  var self = this
  if (this.grouping === 'artist') {
    return this.entries.group(function (track) {
      return track.mainArtist.toLowerCase()
    })
  } else if (this.grouping === 'album') {
    return this.getTrackInfo().then(function () {
      return self.entries.group(function (track) {
        return track.album.toLowerCase()
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
 * Log information about the collection.
 */
Collection.prototype.log = function () {
  var log = this.toLog()
  if (log) {
    console.log('\n' + log)
  }
}

/**
 * Order the collection entries.
 * @return {Promise} A Promise to perform the action.
 */
Collection.prototype.order = function () {
  var self = this
  if (this.ordering === 'popularity') {
    return this.getPopularity().then(function () {
      self.entries.orderByPopularity()
    })
  } else if (this.ordering === 'lastfm') {
    return this.getLastfm().then(function () {
      self.entries.orderByLastfm()
    })
  } else {
    return Promise.resolve(this.entries)
  }
}

/**
 * Print the collection to the console.
 * @param {string} [format] - The output format.
 * May be `csv`, `list`, `log` or `uri` (the default).
 */
Collection.prototype.print = function (format) {
  console.log(this.toString(format))
}

/**
 * Reverse the order of the entries.
 * @return {Promise | Collection} - Itself.
 */
Collection.prototype.reorder = function () {
  if (this.reverse) {
    return this.entries.reverse()
  } else if (this.shuffle) {
    return this.entries.shuffle()
  }
  return Promise.resolve(this.entries)
}

/**
 * Convert the collection to CSV format.
 * @return {string} A newline-separated list of comma-separated values.
 */
Collection.prototype.toCSV = function () {
  var result = 'sep=,\n'
  this.forEachTrack(function (track) {
    var csvFormat = new CSV(track)
    var csvLine = csvFormat.toString()
    result += csvLine + '\n'
  })
  return result.trim()
}

/**
 * Convert the collection to a string.
 * @return {string} A newline-separated list of track titles.
 */
Collection.prototype.toList = function () {
  var result = ''
  this.forEachTrack(function (track) {
    result += track.title + '\n'
  })
  return result.trim()
}

/**
 * Produce a log string.
 * @return {string} A newline-separated list of track information.
 */
Collection.prototype.toLog = function () {
  var result = ''
  this.forEachTrack(function (track) {
    if (track.title) {
      var line = track.title
      if (track.popularity || track.lastfm) {
        line += ' ('
        line += track.popularity ? ('Spotify popularity: ' + track.popularity) : ''
        line += (track.popularity && track.lastfm) ? ', ' : ''
        line += track.lastfm ? 'Last.fm rating: ' + track.lastfm : ''
        line += ')'
      }
      result += line + '\n'
    }
  })
  return result.trim()
}

/**
 * Convert the collection to a string.
 * @param {string} [format] - The output format.
 * May be `csv`, `list`, `log` or `uri` (the default).
 * @return {string} A newline-separated list of Spotify URIs.
 */
Collection.prototype.toString = function (format) {
  format = format || (this.csv ? 'csv' : '')
  this.log()
  if (format === 'csv') {
    return this.toCSV()
  } else if (format === 'list') {
    return this.toList()
  } else if (format === 'log') {
    return this.toLog()
  } else {
    return this.toURIs()
  }
}

/**
 * Convert the collection to a string.
 * @return {string} A newline-separated list of Spotify URIs.
 */
Collection.prototype.toURIs = function () {
  var result = ''
  this.forEachTrack(function (track) {
    result += track.uri + '\n'
  })
  return result.trim()
}

module.exports = Collection
