/* global describe, it */
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

var eol = require('eol')
var Artist = require('../lib/artist')
var Album = require('../lib/album')
var Parser = require('../lib/parser')
var Queue = require('../lib/queue')
var Track = require('../lib/track')
var sort = require('../lib/sort')

describe('Spotify Playlist Generator', function () {
  this.timeout(999999)

  describe('Sorting', function () {
    it('should handle empty lists', function () {
      sort([], function (a, b) {
        return (a < b) ? -1 : ((a > b) ? 1 : 0)
      }).should.eql([])
    })

    it('should handle singleton lists', function () {
      sort([1], function (a, b) {
        return (a < b) ? -1 : ((a > b) ? 1 : 0)
      }).should.eql([1])
    })

    it('should stably sort the list', function () {
      sort([1, 4, 2, 8], function (a, b) {
        return (a < b) ? -1 : ((a > b) ? 1 : 0)
      }).should.eql([1, 2, 4, 8])
    })

    it('should work with an ascending comparison function', function () {
      sort([1, 4, 2, 8], sort.ascending(function (x) {
        return x
      })).should.eql([1, 2, 4, 8])
    })

    it('should work with a descending comparison function', function () {
      sort([1, 4, 2, 8], sort.descending(function (x) {
        return x
      })).should.eql([8, 4, 2, 1])
    })

    it('should preserve the order of duplicate elements', function () {
      sort([[1, 0], [4, 1], [2, 2], [4, 3], [8, 4]], function (a, b) {
        var x = a[0]
        var y = b[0]
        return (x < y) ? -1 : ((x > y) ? 1 : 0)
      }).should.eql([[1, 0], [2, 2], [4, 1], [4, 3], [8, 4]])
    })
  })

  describe('Queue', function () {
    it('should create an empty list', function () {
      var queue = new Queue()
      queue.queue.should.eql([])
    })

    it('should add an entry', function () {
      var entry = new Track(null, 'test')
      var queue = new Queue()
      queue.add(entry)
      queue.should.have.deep.property('queue[0].entry', 'test')
    })

    it('should store entries in the order they are added', function () {
      var foo = new Track(null, 'foo')
      var bar = new Track(null, 'bar')
      var queue = new Queue()
      queue.add(foo)
      queue.add(bar)
      queue.should.have.deep.property('queue[0].entry', 'foo')
      queue.should.have.deep.property('queue[1].entry', 'bar')
    })

    it('should remove duplicates', function () {
      var foo1 = new Track(null, 'foo')
      var foo2 = new Track(null, 'foo')
      var bar = new Track(null, 'bar')
      var queue = new Queue()
      queue.add(foo1)
      queue.add(foo2)
      queue.add(bar)
      return queue.dedup().then(function (queue) {
        queue.should.have.deep.property('queue[0].entry', 'foo')
        queue.should.have.deep.property('queue[1].entry', 'bar')
      })
    })

    it('should be sortable', function () {
      var foo = new Track(null, 'foo')
      var bar = new Track(null, 'bar')
      var queue = new Queue()
      queue.add(foo)
      queue.add(bar)
      queue.sort()
      queue.should.have.deep.property('queue[0].entry', 'bar')
      queue.should.have.deep.property('queue[1].entry', 'foo')
    })

    it('should be sortable with compare function', function () {
      var foo = new Track(null, 'foo')
      var bar = new Track(null, 'bar')
      var queue = new Queue()
      queue.add(foo)
      queue.add(bar)
      queue.sort(function (a, b) {
        return (a.entry < b.entry) ? -1 : ((a.entry > b.entry) ? 1 : 0)
      })
      queue.should.have.deep.property('queue[0].entry', 'bar')
      queue.should.have.deep.property('queue[1].entry', 'foo')
    })

    it('should concatenate queues and preserve order', function () {
      var foo = new Track(null, 'foo')
      var bar = new Track(null, 'bar')
      var baz = new Track(null, 'baz')
      var queue1 = new Queue()
      var queue2 = new Queue()
      queue1.add(foo)
      queue1.add(bar)
      queue2.add(baz)
      var queue3 = queue1.concat(queue2)
      queue3.should.have.deep.property('queue[0].entry', 'foo')
      queue3.should.have.deep.property('queue[1].entry', 'bar')
      queue3.should.have.deep.property('queue[2].entry', 'baz')
    })

    it('should group on a property', function () {
      var foo = new Track(null, 'foo')
      var bar = new Track(null, 'bar')
      var baz = new Track(null, 'baz')
      foo.group = '1'
      bar.group = '2'
      baz.group = '1'
      var queue = new Queue()
      queue.add(foo)
      queue.add(bar)
      queue.add(baz)
      queue.group(function (entry) {
        return entry.group
      })
      queue.should.have.deep.property('queue[0].entry', 'foo')
      queue.should.have.deep.property('queue[1].entry', 'baz')
      queue.should.have.deep.property('queue[2].entry', 'bar')
    })
  })

  describe('Track', function () {
    it('should create an empty track', function () {
      var track = new Track(null, '')
      track.entry.should.eql('')
    })

    it('should create a single track', function () {
      var track = new Track(null, 'test')
      track.entry.should.eql('test')
    })

    it('should dispatch a single track', function () {
      var track = new Track(null, 'test')
      track.entry.should.eql('test')
      var promise = track.dispatch()
      return promise.should.eventually.be.an.instanceof(Track)
    })

    it('should not confuse album title with track title', function () {
      var track = new Track(null, 'Off the Wall - Michael Jackson')
      return track.dispatch().then(function (track) {
        track.title.should.eql('Off the Wall - Michael Jackson')
      })
    })
  })

  describe('Generator', function () {
    it('should create empty playlist when passed empty string', function () {
      var parser = new Parser()
      var collection = parser.parse('')
      collection.should.have.deep.property('entries.queue').that.eql([])
    })

    it('should create a one-entry playlist', function () {
      var parser = new Parser()
      var collection = parser.parse('test')
      collection.should.have.deep.property('entries.queue[0].entry', 'test')
    })

    it('should create a two-entry playlist', function () {
      var parser = new Parser()
      var collection = parser.parse('test1\ntest2')
      collection.should.have.deep.property('entries.queue[0].entry', 'test1')
      collection.should.have.deep.property('entries.queue[1].entry', 'test2')
    })

    it('should ignore empty lines', function () {
      var parser = new Parser()
      var collection = parser.parse('test1\n\n\n\ntest2')
      collection.should.have.deep.property('entries.queue[0].entry', 'test1')
      collection.should.have.deep.property('entries.queue[1].entry', 'test2')
    })

    it('should order tracks by Spotify popularity', function () {
      var parser = new Parser()
      var collection = parser.parse('#ORDER BY POPULARITY\ntest1\ntest2')
      collection.should.have.deep.property('entries.queue[0].entry', 'test1')
      collection.should.have.deep.property('entries.queue[1].entry', 'test2')
      collection.should.have.property('ordering', 'popularity')
    })

    it('should order tracks by Last.fm rating', function () {
      var parser = new Parser()
      var collection = parser.parse('#ORDER BY LASTFM\ntest1\ntest2')
      collection.should.have.deep.property('entries.queue[0].entry', 'test1')
      collection.should.have.deep.property('entries.queue[1].entry', 'test2')
      collection.should.have.property('ordering', 'lastfm')
    })

    it('should create an ordered playlist', function () {
      var parser = new Parser()
      var collection = parser.parse('#ORDER BY POPULARITY\ntest1\ntest2')
      return collection.execute().then(function (str) {
        // FIXME: this is really brittle
        eol.lf(str).should.eql('spotify:track:0nJaPZB8zftehHfGNSMagY\n' +
                               'spotify:track:0MB5wpo41nfoiaD96wWOtW')
      })
    })

    it('should parse album entries', function () {
      var parser = new Parser()
      var collection = parser.parse('#ALBUM test')
      collection.should.have.deep.property('entries.queue[0]')
        .that.is.instanceof(Album)
    })

    it('should parse artist entries', function () {
      var parser = new Parser()
      var collection = parser.parse('#ARTIST test')
      collection.should.have.deep.property('entries.queue[0]')
        .that.is.instanceof(Artist)
    })

    it('should dispatch all entries', function () {
      var parser = new Parser()
      var collection = parser.parse('test1\ntest2')
      return collection.execute().then(function (str) {
        // FIXME: this is really brittle
        eol.lf(str).should.eql('spotify:track:0nJaPZB8zftehHfGNSMagY\n' +
                               'spotify:track:0MB5wpo41nfoiaD96wWOtW')
      })
    })
  })

  describe('Album', function () {
    it('should create an empty album', function () {
      var album = new Album(null, '')
      album.entry.should.eql('')
    })

    it('should create a single album', function () {
      var album = new Album(null, 'test')
      album.entry.should.eql('test')
    })

    it('should dispatch a single album', function () {
      var album = new Album(null, 'test')
      album.entry.should.eql('test')
      var promise = album.dispatch()
      return promise.should.eventually.be.instanceof(Queue)
    })
  })

  describe('Artist', function () {
    it('should create an empty artist', function () {
      var artist = new Artist(null, '')
      artist.entry.should.eql('')
    })

    it('should create a single artist', function () {
      var artist = new Artist(null, 'test')
      artist.entry.should.eql('test')
    })

    it('should fetch an artist\'s tracks', function () {
      var artist = new Artist(null, 'test', null, 5)
      artist.entry.should.eql('test')
      var promise = artist.dispatch()
      return promise.should.eventually.be.an.instanceof(Queue)
    })
  })
})
