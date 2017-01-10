/* global describe, it */
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

var Artist = require('../lib/artist')
var Album = require('../lib/album')
var Playlist = require('../lib/playlist')
var Queue = require('../lib/queue')
var Track = require('../lib/track')

describe('spotify.js', function () {
  this.timeout(99999)

  describe('Queue', function () {
    it('should create an empty list', function () {
      var queue = new Queue()
      queue.queue.should.eql([])
    })

    it('should add an entry', function () {
      var entry = new Track('test')
      var queue = new Queue()
      queue.add(entry)
      queue.should.have.deep.property('queue[0].entry', 'test')
    })

    it('should store entries in the order they are added', function () {
      var foo = new Track('foo')
      var bar = new Track('bar')
      var queue = new Queue()
      queue.add(foo)
      queue.add(bar)
      queue.should.have.deep.property('queue[0].entry', 'foo')
      queue.should.have.deep.property('queue[1].entry', 'bar')
    })

    it('should remove duplicates', function () {
      var foo1 = new Track('foo')
      var foo2 = new Track('foo')
      var bar = new Track('bar')
      var queue = new Queue()
      queue.add(foo1)
      queue.add(foo2)
      queue.add(bar)
      queue.dedup()
      queue.should.have.deep.property('queue[0].entry', 'foo')
      queue.should.have.deep.property('queue[1].entry', 'bar')
    })

    it('should be sortable', function () {
      var foo = new Track('foo')
      var bar = new Track('bar')
      var queue = new Queue()
      queue.add(foo)
      queue.add(bar)
      queue.sort()
      queue.should.have.deep.property('queue[0].entry', 'bar')
      queue.should.have.deep.property('queue[1].entry', 'foo')
    })

    it('should be sortable with compare function', function () {
      var foo = new Track('foo')
      var bar = new Track('bar')
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
      var foo = new Track('foo')
      var bar = new Track('bar')
      var baz = new Track('baz')
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
      var foo = new Track('foo')
      var bar = new Track('bar')
      var baz = new Track('baz')
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
      var track = new Track('')
      track.entry.should.eql('')
    })

    it('should create a single track', function () {
      var track = new Track('test')
      track.entry.should.eql('test')
    })

    it('should dispatch a single track', function () {
      var track = new Track('test')
      track.entry.should.eql('test')
      var promise = track.dispatch()
      return promise.should.eventually.be.an.instanceof(Track)
    })

    it('should not confuse album title with track title', function () {
      var track = new Track('Off the Wall - Michael Jackson')
      return track.dispatch().then(function (track) {
        track.uri().should.eql('spotify:track:3zYpRGnnoegSpt3SguSo3W')
      })
    })
  })

  describe('Playlist', function () {
    it('should create empty playlist when passed empty string', function () {
      var playlist = new Playlist('')
      playlist.should.have.deep.property('entries.queue').that.eql([])
    })

    it('should create a one-entry playlist', function () {
      var playlist = new Playlist('test')
      playlist.should.have.deep.property('entries.queue[0].entry', 'test')
    })

    it('should create a two-entry playlist', function () {
      var playlist = new Playlist('test1\ntest2')
      playlist.should.have.deep.property('entries.queue[0].entry', 'test1')
      playlist.should.have.deep.property('entries.queue[1].entry', 'test2')
    })

    it('should ignore empty lines', function () {
      var playlist = new Playlist('test1\n\n\n\ntest2')
      playlist.should.have.deep.property('entries.queue[0].entry', 'test1')
      playlist.should.have.deep.property('entries.queue[1].entry', 'test2')
    })

    it('should order tracks by Spotify popularity', function () {
      var playlist = new Playlist('#ORDER BY POPULARITY\ntest1\ntest2')
      playlist.should.have.deep.property('entries.queue[0].entry', 'test1')
      playlist.should.have.deep.property('entries.queue[1].entry', 'test2')
      playlist.should.have.property('ordering', 'popularity')
    })

    it('should order tracks by Last.fm rating', function () {
      var playlist = new Playlist('#ORDER BY LASTFM\ntest1\ntest2')
      playlist.should.have.deep.property('entries.queue[0].entry', 'test1')
      playlist.should.have.deep.property('entries.queue[1].entry', 'test2')
      playlist.should.have.property('ordering', 'lastfm')
    })

    it('should create an ordered playlist', function () {
      var playlist = new Playlist('#ORDER BY POPULARITY\ntest1\ntest2')
      var promise = playlist.dispatch()
      // FIXME: this is really brittle
      return promise.should.eventually.eql('spotify:track:5fUSaE4HYpnVqS9VFv5Z7m\n' +
                                           'spotify:track:3fWs8HBZMvZDi3TqiUu3gZ')
    })

    it('should parse album entries', function () {
      var playlist = new Playlist('#ALBUM test')
      playlist.should.have.deep.property('entries.queue[0]')
        .that.is.instanceof(Album)
    })

    it('should parse artist entries', function () {
      var playlist = new Playlist('#ARTIST test')
      playlist.should.have.deep.property('entries.queue[0]')
        .that.is.instanceof(Artist)
    })

    it('should dispatch all entries', function () {
      var playlist = new Playlist('test1\ntest2')
      var promise = playlist.dispatch()
      // FIXME: this is really brittle
      return promise.should.eventually.eql('spotify:track:5fUSaE4HYpnVqS9VFv5Z7m\n' +
                                           'spotify:track:3fWs8HBZMvZDi3TqiUu3gZ')
    })
  })

  describe('Album', function () {
    it('should create an empty album', function () {
      var album = new Album('')
      album.entry.should.eql('')
    })

    it('should create a single album', function () {
      var album = new Album('test')
      album.entry.should.eql('test')
    })

    it('should dispatch a single album', function () {
      var album = new Album('test')
      album.entry.should.eql('test')
      var promise = album.dispatch()
      return promise.should.eventually.be.instanceof(Queue)
    })
  })

  describe('Artist', function () {
    it('should create an empty artist', function () {
      var artist = new Artist('')
      artist.entry.should.eql('')
    })

    it('should create a single artist', function () {
      var artist = new Artist('test')
      artist.entry.should.eql('test')
    })

    it('should fetch an artist\'s tracks', function () {
      var artist = new Artist('test')
      artist.entry.should.eql('test')
      var promise = artist.dispatch()
      return promise.should.eventually.be.an.instanceof(Queue)
    })
  })
})
