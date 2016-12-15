/* global describe, it */
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

var spotify = require('../spotify.js')

describe('spotify.js', function () {
  this.timeout(99999)

  describe('Playlist', function () {
    it('should create empty playlist when passed empty string', function () {
      var playlist = new spotify.Playlist('')
      playlist.should.have.deep.property('queries.queue').that.eql([])
    })

    it('should create a one-track playlist', function () {
      var playlist = new spotify.Playlist('test')
      playlist.should.have.deep.property('queries.queue[0].query', 'test')
    })

    it('should create a two-track playlist', function () {
      var playlist = new spotify.Playlist('test1\ntest2')
      playlist.should.have.deep.property('queries.queue[0].query', 'test1')
      playlist.should.have.deep.property('queries.queue[1].query', 'test2')
    })

    it('should ignore empty lines', function () {
      var playlist = new spotify.Playlist('test1\n\n\n\ntest2')
      playlist.should.have.deep.property('queries.queue[0].query', 'test1')
      playlist.should.have.deep.property('queries.queue[1].query', 'test2')
    })

    it('should create a sorted playlist', function () {
      var playlist = new spotify.Playlist('#ORDER BY POPULARITY\ntest1\ntest2')
      playlist.should.have.deep.property('queries.queue[0].query', 'test1')
      playlist.should.have.deep.property('queries.queue[1].query', 'test2')
      playlist.should.have.property('order', 'popularity')
    })

    it('should parse album queries', function () {
      var playlist = new spotify.Playlist('#ALBUM test')
      playlist.should.have.deep.property('queries.queue[0]')
        .that.is.instanceof(spotify.Album)
    })

    it('should parse artist queries', function () {
      var playlist = new spotify.Playlist('#ARTIST test')
      playlist.should.have.deep.property('queries.queue[0]')
        .that.is.instanceof(spotify.Artist)
    })

    it('should dispatch all queries', function () {
      var playlist = new spotify.Playlist('test1\ntest2')
      var promise = playlist.dispatch()
      return promise.should.eventually.eql('spotify:track:5jwDjl5FofuDgwITfcROhq\nspotify:track:25BfjHTtaDCrKrq9hkr10U')
    })
  })

  describe('Album', function () {
    it('should create an empty album', function () {
      var album = new spotify.Album('')
      album.query.should.eql('')
    })

    it('should create a single album', function () {
      var album = new spotify.Album('test')
      album.query.should.eql('test')
    })

    it('should dispatch a single album', function () {
      var album = new spotify.Album('test')
      album.query.should.eql('test')
      var promise = album.dispatch()
      return promise.should.eventually.be.instanceof(spotify.Queue)
    })
  })

  describe('Artist', function () {
    it('should create an empty artist', function () {
      var artist = new spotify.Artist('')
      artist.query.should.eql('')
    })

    it('should create a single artist', function () {
      var artist = new spotify.Artist('test')
      artist.query.should.eql('test')
    })

    it('should fetch an artist\'s tracks', function () {
      var artist = new spotify.Artist('test')
      artist.query.should.eql('test')
      var promise = artist.dispatch()
      return promise.should.eventually.be.an.instanceof(spotify.Queue)
    })
  })

  describe('Track', function () {
    it('should create an empty track', function () {
      var track = new spotify.Track('')
      track.query.should.eql('')
    })

    it('should create a single track', function () {
      var track = new spotify.Track('test')
      track.query.should.eql('test')
    })

    it('should dispatch a single track', function () {
      var track = new spotify.Track('test')
      track.query.should.eql('test')
      var promise = track.dispatch()
      return promise.should.eventually.be.an.instanceof(spotify.Queue)
    })
  })

  describe('Queue', function () {
    it('should create an empty list', function () {
      var queue = new spotify.Queue()
      queue.queue.should.eql([])
    })

    it('should convert a URI into a singleton queue', function () {
      var uri = new spotify.URI('test')
      var queue = new spotify.Queue(uri)
      queue.should.have.deep.property('queue[0].query', 'test')
    })

    it('should add a URI', function () {
      var uri = new spotify.URI('test')
      var queue = new spotify.Queue()
      queue.add(uri)
      queue.should.have.deep.property('queue[0].query', 'test')
    })

    it('should store queue in the order they are added', function () {
      var foo = new spotify.URI('foo')
      var bar = new spotify.URI('bar')
      var queue = new spotify.Queue()
      queue.add(foo)
      queue.add(bar)
      queue.should.have.deep.property('queue[0].query', 'foo')
      queue.should.have.deep.property('queue[1].query', 'bar')
    })

    it('should concatenate queues in the same order', function () {
      var foo = new spotify.URI('foo')
      var bar = new spotify.URI('bar')
      var baz = new spotify.URI('baz')
      var queue1 = new spotify.Queue()
      var queue2 = new spotify.Queue()
      queue1.add(foo)
      queue1.add(bar)
      queue2.add(baz)
      var queue3 = queue1.concat(queue2)
      queue3.should.have.deep.property('queue[0].query', 'foo')
      queue3.should.have.deep.property('queue[1].query', 'bar')
      queue3.should.have.deep.property('queue[2].query', 'baz')
    })
  })
})
