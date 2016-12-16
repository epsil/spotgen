#!/usr/bin/env node

/* eslint-disable no-unused-vars */
var async = require('async')
var fs = require('fs')
var request = require('request')

var defaults = require('./defaults')
var lastfm = require('./lastfm')(defaults.api)

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
   * Playlist order.
   */
  this.ordering = null

  /**
   * Playlist grouping.
   */
  this.grouping = true

  /**
   * Unique flag.
   */
  this.unique = true

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
        this.ordering = 'popularity'
      } else if (query.match(/^#ORDER BY LAST.?FM/i)) {
        this.ordering = 'lastfm'
      } else if (query.match(/^#GROUP BY ENTRY/i)) {
        this.grouping = 'entry'
      } else if (query.match(/^#GROUP BY ARTIST/i)) {
        this.grouping = 'artist'
      } else if (query.match(/^#GROUP BY ALBUM/i)) {
        this.grouping = 'album'
      } else if (query.match(/^#UNIQUE/i)) {
        this.unique = true
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
   * Dispatch all the queries in the playlist
   * and return the track listing.
   * @return {Queue} A list of results.
   */
  this.dispatch = function () {
    return self.fetchTracks()
      .then(self.dedup)
      .then(self.order)
      .then(self.group)
      .then(self.toString)
  }

  /**
   * Dispatch the queries in the playlist.
   */
  this.fetchTracks = function () {
    return self.queries.dispatch().then(function (result) {
      self.tracks = result.flatten()
      return self
    })
  }

  /**
   * Refresh the tracks in the playlist.
   */
  this.refreshTracks = function () {
    return self.tracks.dispatch().then(function (result) {
      self.tracks = result.flatten()
      return self
    })
  }

  /**
   * Fetch Last.fm information.
   */
  this.fetchLastfm = function () {
    return self.tracks.resolveAll(function (entry) {
      return entry.fetchLastfm()
    }).then(function (result) {
      return self
    })
  }

  /**
   * Remove duplicates.
   */
  this.dedup = function () {
    if (self.unique) {
      self.tracks.dedup()
    }
  }

  this.order = function () {
    if (self.ordering === 'popularity') {
      return self.refreshTracks()
        .then(self.orderByPopularity)
    } else if (self.ordering === 'lastfm') {
      return self.fetchLastfm()
        .then(self.orderByLastfm)
    }
  }

  this.orderByPopularity = function () {
    self.tracks.sort(function (a, b) {
      var x = a.popularity()
      var y = b.popularity()
      var val = (x < y) ? 1 : ((x > y) ? -1 : 0)
      return val
    })
  }

  this.orderByLastfm = function () {
    self.tracks.sort(function (a, b) {
      var x = a.lastfm()
      var y = b.lastfm()
      var val = (x < y) ? 1 : ((x > y) ? -1 : 0)
      return val
    })
  }

  this.groupByArtist = function () {
    self.tracks.group(function (track) {
      return track.artist()
    })
  }

  this.groupByAlbum = function () {
    self.tracks.group(function (track) {
      return track.album()
    })
  }

  this.groupByEntry = function () {
    self.tracks.group(function (track) {
      return track.query
    })
  }

  this.group = function () {
    if (self.grouping === 'artist') {
      return self.groupByArtist()
    } else if (self.grouping === 'album') {
      return self.refreshTracks()
        .then(self.groupByAlbum)
    } else if (self.grouping === 'entry') {
      return self.groupByEntry()
    }
  }

  /**
   * Convert the playlist to a string.
   * @return {string} A newline-separated list of Spotify URIs.
   */
  this.toString = function () {
    var result = ''
    self.tracks.forEach(function (track) {
      console.log(track.toString())
      console.log(track.lastfm())
      var uri = track.uri()
      if (uri !== '') {
        result += uri + '\n'
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

  this.size = function () {
    return self.queue.length
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

  this.contains = function (obj) {
    for (var i in self.queue) {
      var entry = self.queue[i]
      if ((entry.equals && entry.equals(obj)) ||
          entry === obj) {
        return true
      }
    }
    return false
  }

  this.dedup = function () {
    var result = new spotify.Queue()
    self.queue.forEach(function (entry) {
      if (!result.contains(entry)) {
        result.add(entry)
      }
    })
    self.queue = result.queue
    return self
  }

  this.group = function (fn) {
    var map = []
    var result = []
    for (var i in self.queue) {
      var entry = self.queue[i]
      var key = fn(entry)

      if (!map[key]) {
        map[key] = []
      }
      map[key].push(entry)
    }
    for (var k in map) {
      result = result.concat(map[k])
    }
    self.queue = result
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
  this.resolveAll = function (fn) {
    // we could have used Promise.all(), but we choose to roll our
    // own, sequential implementation to avoid overloading the server
    var result = new spotify.Queue()
    var ready = Promise.resolve(null)
    self.queue.forEach(function (entry) {
      ready = ready.then(function () {
        return fn(entry)
      }).then(function (value) {
        result.add(value)
      })
    })
    return ready.then(function () {
      return result
    })
  }

  /**
   * Dispatch all entries in order.
   * @return {Queue} A list of results.
   */
  this.dispatch = function () {
    return self.resolveAll(function (entry) {
      return entry.dispatch()
    })
  }
}

/**
 * Track query.
 * @constructor
 * @param {string} query - The track to search for.
 * @param {JSON} [response] - Track response object.
 * Should have the property `uri`.
 * @param {JSON} [responseSimple] - Simplified track response object.
 */
spotify.Track = function (query, response) {
  /**
   * Self reference.
   */
  var self = this

  /**
   * Query string.
   */
  this.query = query.trim()

  /**
   * Simplified track object.
   */
  this.responseSimple = null

  /**
   * Full track object.
   */
  this.response = null

  /**
   * Whether a track object is full or simplified.
   * A full object includes information (like popularity)
   * that a simplified object does not.
   */
  this.isFullResponse = function (response) {
    return response && response.popularity
  }

  if (self.isFullResponse(response)) {
    self.response = response
  } else {
    self.responseSimple = response
  }

  /**
   * Dispatch query.
   * @return {Promise | URI} The track info.
   */
  this.dispatch = function () {
    if (self.response) {
      return Promise.resolve(self)
    } else if (self.responseSimple) {
      return self.fetchTrack(self.responseSimple)
    } else {
      return self.searchForTrack(self.query)
    }
  }

  /**
   * Fetch track.
   * @param {JSON} responseSimple - A simplified track response.
   * @return {Promise | Track} A track with
   * a full track response.
   */
  this.fetchTrack = function (responseSimple) {
    var id = responseSimple.id
    var url = 'https://api.spotify.com/v1/tracks/'
    url += encodeURIComponent(id)
    return spotify.request(url).then(function (result) {
      self.response = result
      return self
    })
  }

  /**
   * Search for track.
   * @param {string} query - The query text.
   * @return {Promise | Track} A track with
   * a simplified track response.
   */
  this.searchForTrack = function (query) {
    // https://developer.spotify.com/web-api/search-item/
    var url = 'https://api.spotify.com/v1/search?type=track&q='
    url += encodeURIComponent(query)
    return spotify.request(url).then(function (result) {
      if (result.tracks &&
          result.tracks.items[0] &&
          result.tracks.items[0].uri) {
        self.responseSimple = result.tracks.items[0]
        return self
      }
    })
  }

  /**
   * Fetch Last.fm information.
   */
  this.fetchLastfm = function () {
    var artist = self.artist()
    var title = self.title()
    return lastfm.getInfo(artist, title).then(function (result) {
      self.lastfmResponse = result
      return self
    })
  }

  /**
   * Last.fm rating.
   * @return {Integer} The playcount, or -1 if not available.
   */
  this.lastfm = function () {
    if (self.lastfmResponse) {
      return parseInt(self.lastfmResponse.track.playcount)
    } else {
      return -1
    }
  }

  /**
   * Spotify URI.
   * @return {string} The Spotify URI
   * (a string on the form `spotify:track:xxxxxxxxxxxxxxxxxxxxxx`),
   * or the empty string if not available.
   */
  this.uri = function () {
    if (self.response) {
      return self.response.uri
    } else if (self.responseSimple) {
      return self.responseSimple.uri
    } else {
      return ''
    }
  }

  /**
   * Spotify popularity.
   * @return {int} The Spotify popularity, or -1 if not available.
   */
  this.popularity = function () {
    if (self.response) {
      return self.response.popularity
    } else {
      return -1
    }
  }

  /**
   * Track main artist.
   * @return {string} The main artist.
   */
  this.artist = function () {
    var artists = []
    var response = self.response || self.responseSimple
    if (response &&
        response.artists &&
        response.artists[0] &&
        response.artists[0].name) {
      return response.artists[0].name.trim()
    } else {
      return ''
    }
  }

  /**
   * Track artists.
   * @return {string} All the track artists, separated by `, `.
   */
  this.artists = function () {
    var artists = []
    var response = self.response || self.responseSimple
    if (response &&
        response.artists) {
      artists = self.response.artists.map(function (artist) {
        return artist.name.trim()
      })
    }
    return artists.join(', ')
  }

  /**
   * Track title.
   * @return {string} The track title.
   */
  this.title = function () {
    var response = self.response || self.responseSimple
    if (response &&
        response.name) {
      return response.name
    } else {
      return ''
    }
  }

  /**
   * Track album.
   * @return {string} The track album,
   * or the empty string if not available.
   */
  this.album = function () {
    if (self.response &&
        self.response.album &&
        self.response.album.name) {
      return self.response.album.name
    } else {
      return ''
    }
  }

  /**
   * Full track name.
   * @return {string} The track name, on the form `Title - Artist`.
   */
  this.name = function () {
    var title = self.title()
    if (title !== '') {
      var artist = self.artist()
      if (artist !== '') {
        return title + ' - ' + artist
      } else {
        return title
      }
    } else {
      return ''
    }
  }

  /**
   * Whether this track is identical to another track.
   */
  this.equals = function (track) {
    var str1 = self.toString().toLowerCase()
    var str2 = track.toString().toLowerCase()
    return str1 === str2
  }

  /**
   * Full track title.
   * @return {string} The track title, on the form `Title - Artist`.
   */
  this.toString = function () {
    var name = self.name()
    if (name !== '') {
      return name
    } else {
      return self.query
    }
  }
}

/**
 * Album query.
 * @constructor
 * @param {string} query - The album to search for.
 */
spotify.Album = function (query, response) {
  /**
   * Self reference.
   */
  var self = this

  if (typeof query === 'string') {
    this.query = query.trim()
  }

  /**
   * Dispatch query.
   * @return {Promise | Queue} The track list.
   */
  this.dispatch = function () {
    if (self.searchResponse) {
      return self.fetchAlbum(self.searchResponse)
        .then(self.createQueue)
    } else if (self.albumResponse) {
      return self.fetchAlbum(self.albumResponse)
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
    url += encodeURIComponent(query)
    return spotify.request(url).then(function (response) {
      if (self.isSearchResponse(response)) {
        this.searchResponse = response
        return Promise.resolve(response)
      } else {
        return Promise.reject(response)
      }
    })
  }

  this.fetchAlbum = function (response) {
    var id = (self.isSearchResponse(response) &&
              response.albums.items[0].id) || response.id
    var url = 'https://api.spotify.com/v1/albums/'
    url += encodeURIComponent(id)
    return spotify.request(url).then(function (response) {
      if (self.isAlbumResponse(response)) {
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
      var track = new spotify.Track(self.query, tracks[i])
      queue.add(track)
    }
    return queue
  }

  this.isSearchResponse = function (response) {
    return response &&
      response.albums &&
      response.albums.items[0] &&
      response.albums.items[0].id
  }

  this.isAlbumResponse = function (response) {
    return response &&
      response.id
  }

  if (self.isSearchResponse(response)) {
    self.searchResponse = response
  } else if (self.isAlbumResponse(response)) {
    self.albumResponse = response
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
      .then(self.createQueue)
  }

  this.searchForArtist = function (query) {
    // https://developer.spotify.com/web-api/search-item/
    var url = 'https://api.spotify.com/v1/search?type=artist&q='
    url += encodeURIComponent(query)
    return spotify.request(url).then(function (response) {
      if (self.isSearchResponse(response)) {
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

  this.createQueue = function (response) {
    var albums = response.items
    var queries = new spotify.Queue()
    for (var i in albums) {
      var albumQuery = new spotify.Album(self.query, albums[i])
      queries.add(albumQuery)
    }
    return queries.dispatch()
  }

  this.isSearchResponse = function (response) {
    return response &&
      response.artists &&
      response.artists.items[0] &&
      response.artists.items[0].id
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

Use prototype property for defining methods

Be able to group tracks by album, artist, etc.

Implement merging algorithm from last.py

Clean up repetitious Playlist.dispatch() method

Add support for spotify:track:xxxxxxxxxxxxxxxxxxxxxx entries
*/
