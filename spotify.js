#!/usr/bin/env node

/* eslint-disable no-unused-vars */
var async = require('async')
var fs = require('fs')
var request = require('request')

var spotify = {}

/**
 * Represents a playlist.
 * @constructor
 * @param {string} str - The playlist as a string.
 */
spotify.Playlist = function (str) {
  /**
   * Self reference.
   */
  var self = this

  /**
   * List of queries.
   */
  this.queries = new spotify.Queue()

  /**
   * List of tracks.
   */
  this.tracks = new spotify.Queue()

  /**
   * List of URIs.
   */
  this.uris = new spotify.Queue()

  str = str.trim()
  if (str !== '') {
    var queries = str.split(/\r|\n|\r\n/)
    while (queries.length > 0) {
      var query = queries.shift()
      if (query.match(/^#ORDER BY POPULARITY/i)) {
        this.order = 'popularity'
      } else if (query.match(/^#ALBUM /i)) {
        var album = new spotify.Album(query.substring(7))
        this.queries.add(album)
      } else if (query.match(/^#ARTIST /i)) {
        var artist = new spotify.Artist(query.substring(8))
        this.queries.add(artist)
      } else if (query !== '') {
        var track = new spotify.Track(query)
        this.queries.add(track)
      }
    }
  }

  /**
   * Dispatch all the queries in the playlist.
   * @return {Queue} A list of results.
   */
  this.dispatch = function () {
    return self.fetchTracks()
               .then(self.toString)
  }

  this.fetchTracks = function () {
    return this.queries.dispatch().then(function (result) {
      self.tracks = result.flatten()
      return self
    })
  }

  /**
   * Convert the playlist to a string.
   * @return {String} A newline-separated list of Spotify URIs.
   */
  this.toString = function () {
    var result = ''
    self.tracks.forEach(function (track) {
      if (track.response &&
          track.response.uri) {
        result += track.response.uri + '\n'
      }
    })
    return result.trim()
  }

  /**
   * Print the playlist to the console.
   */
  this.print = function () {
    console.log(self.toString())
  }
}

/**
 * Queue of playlist entries.
 * @constructor
 * @param {string} [URI] - Playlist URI.
 */
spotify.Queue = function (uri) {
  /**
   * Self reference.
   */
  var self = this

  this.queue = []

  if (uri) {
    this.queue.push(uri)
  }

  this.add = function (entry) {
    self.queue.push(entry)
  }

  this.get = function (idx) {
    return self.queue[idx]
  }

  this.forEach = function (fn) {
    return self.queue.forEach(fn)
  }

  this.map = function (fn) {
    var result = new spotify.Queue()
    self.forEach(function (entry) {
      result.add(fn(entry))
    })
    return result
  }

  this.concat = function (queue) {
    var result = new spotify.Queue()
    result.queue = self.queue
    result.queue = result.queue.concat(queue.queue)
    return result
  }

  this.sort = function (fn) {
    self.queue = self.queue.sort(fn)
    return self
  }

  this.flatten = function () {
    var result = []
    for (var i in self.queue) {
      var entry = self.queue[i]
      if (entry instanceof spotify.Queue) {
        entry = entry.flatten()
        result = result.concat(entry.queue)
      } else {
        result.push(entry)
      }
    }
    self.queue = result
    return self
  }

  /**
   * Dispatch all entries in order.
   * @return {Queue} A list of results.
   */
  this.dispatch = function () {
    // we could have used Promise.all(), but we choose to roll our
    // own, sequential implementation to avoid overloading the server
    var result = new spotify.Queue()
    var ready = Promise.resolve(null)
    self.queue.forEach(function (entry) {
      ready = ready.then(function () {
        return entry.dispatch()
      }).then(function (value) {
        result.add(value)
      })
    })
    return ready.then(function () {
      return result
    })
  }
}

/**
 * Playlist URI.
 * @constructor
 * @param {string} query - Query text.
 * @param {JSON} [response] - Track response object.
 * Should have the property `uri`.
 */
spotify.URI = function (query, response) {
  /**
   * Self reference.
   */
  var self = this

  this.query = query
  this.response = response

  this.refresh = function () {
    var track = new spotify.Track(self.query, self.response)
    return track.dispatch().then(function (queue) {
      var uri = queue.get(0)
      self.response = uri.response
      return self
    })
  }

  this.toString = function () {
    if (self.response &&
        self.response.name) {
      return self.response.name
    } else {
      return self.query
    }
  }
}

/**
 * Track query.
 * @constructor
 * @param {string} query - The track to search for.
 */
spotify.Track = function (query, response) {
  /**
   * Self reference.
   */
  var self = this

  /**
   * Simple track object.
   */
  this.response = response

  /**
   * Query string.
   */
  this.query = query.trim()

  /**
   * Dispatch query.
   * @return {Promise | URI} The track info.
   */
  this.dispatch = function () {
    if (self.response) {
      return self.fetchTrack(self.response)
    } else {
      return self.searchForTrack()
    }
  }

  this.fetchTrack = function (response) {
    var id = response.id
    var url = 'https://api.spotify.com/v1/tracks/'
    url += encodeURIComponent(id)
    return spotify.request(url).then(function (result) {
      var track = new spotify.URI(self.query, result)
      var queue = new spotify.Queue(track)
      return queue
    })
  }

  this.searchForTrack = function () {
    // https://developer.spotify.com/web-api/search-item/
    var url = 'https://api.spotify.com/v1/search?type=track&q='
    url += encodeURIComponent(self.query)
    return spotify.request(url).then(function (result) {
      if (result.tracks &&
          result.tracks.items[0] &&
          result.tracks.items[0].uri) {
        var track = new spotify.URI(self.query, result.tracks.items[0])
        var queue = new spotify.Queue(track)
        return queue
      }
    })
  }
}

/**
 * Album query.
 * @constructor
 * @param {string} query - The album to search for.
 */
spotify.Album = function (query) {
  /**
   * Self reference.
   */
  var self = this

  if (typeof query === 'string') {
    this.query = query.trim()
  }

  this.dispatch = function () {
    if (self.searchResponse) {
      return self.fetchAlbum(self.searchResponse)
                 .then(self.createQueue)
    } else if (self.albumResponseSimple) {
      return self.fetchAlbum(self.albumResponseSimple)
                 .then(self.createQueue)
    } else {
      return self.searchForAlbum(self.query)
                 .then(self.fetchAlbum)
                 .then(self.createQueue)
    }
  }

  this.searchForAlbum = function (query) {
    // https://developer.spotify.com/web-api/search-item/
    var url = 'https://api.spotify.com/v1/search?type=album&q='
    url += encodeURIComponent(self.query)
    return spotify.request(url).then(function (response) {
      if (response.albums &&
          response.albums.items[0] &&
          response.albums.items[0].id) {
        this.searchResponse = response
        return Promise.resolve(response)
      } else {
        return Promise.reject(response)
      }
    })
  }

  this.fetchAlbum = function (response) {
    var id = response.id ? response.id : response.albums.items[0].id
    var url = 'https://api.spotify.com/v1/albums/'
    url += encodeURIComponent(id)
    return spotify.request(url).then(function (response) {
      if (response.tracks &&
          response.tracks.items) {
        this.albumResponse = response
        return Promise.resolve(response)
      } else {
        return Promise.reject(response)
      }
    })
  }

  this.createQueue = function (response) {
    var tracks = response.tracks.items
    var queue = new spotify.Queue()
    for (var i in tracks) {
      var uri = new spotify.URI(self.query, tracks[i])
      queue.add(uri)
    }
    return queue
  }
}

/**
 * Artist query.
 * @constructor
 * @param {string} query - The artist to search for.
 */
spotify.Artist = function (query) {
  /**
   * Self reference.
   */
  var self = this

  /**
   * Query string.
   */
  this.query = query.trim()

  /**
   * Dispatch query.
   * @return {Promise | URI} The artist info.
   */
  this.dispatch = function () {
    return self.searchForArtist(self.query)
               .then(self.fetchAlbums)
               .then(self.fetchTracks)
  }

  this.searchForArtist = function (query) {
    // https://developer.spotify.com/web-api/search-item/
    var url = 'https://api.spotify.com/v1/search?type=artist&q='
    url += encodeURIComponent(self.query)
    return spotify.request(url).then(function (response) {
      if (response.artists &&
          response.artists.items[0] &&
          response.artists.items[0].id) {
        this.artistResponse = response
        return Promise.resolve(response)
      } else {
        return Promise.reject(response)
      }
    })
  }

  this.fetchAlbums = function (response) {
    var id = response.artists.items[0].id
    var url = 'https://api.spotify.com/v1/artists/'
    url += encodeURIComponent(id) + '/albums'
    return spotify.request(url).then(function (response) {
      if (response.items) {
        this.albumResponse = response
        return Promise.resolve(response)
      } else {
        return Promise.reject(response)
      }
    })
  }

  this.fetchTracks = function (response) {
    var albums = response.items
    var queries = new spotify.Queue()
    for (var i in albums) {
      var album = albums[i]
      var albumQuery = new spotify.Album(self.query)
      albumQuery.albumResponseSimple = album
      queries.add(albumQuery)
    }
    return queries.dispatch()
  }
}

/**
 * Perform a Spotify request.
 * @param {string} url - The URL to look up.
 */
spotify.request = function (url) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log(url)
      request(url, function (err, response, body) {
        if (err) {
          reject(err)
        } else if (response.statusCode !== 200) {
          reject(response.statusCode)
        } else {
          try {
            body = JSON.parse(body)
          } catch (e) {
            reject(e)
          }
          if (body.error) {
            reject(body)
          } else {
            resolve(body)
          }
        }
      })
    }, 100)
  })
}

function main () {
  var input = process.argv[2] || 'input.txt'
  var output = process.argv[3] || 'output.txt'

  var str = fs.readFileSync(input, 'utf8').toString()
  var playlist = new spotify.Playlist(str)

  playlist.dispatch().then(function (str) {
    fs.writeFile(output, str, function (err) {
      if (err) { return }
      console.log('Wrote to ' + output)
    })
  })
}

if (require.main === module) {
  main()
}

module.exports = spotify

/*
Food for thought ...

Are Track and URI really the same thing? Should all higher-level
requests (Album, Artist) resolve to a collection of Tracks? Do we
guarantee that each Track is resolved at least once, after which
repeated invocations do nothing?
*/
