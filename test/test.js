/* global describe, it */
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

var spotify = require('../spotify.js')

describe('spotify.js', function () {
  this.timeout(5000)

  describe('Playlist', function () {
    it('should create empty playlist when passed empty string', function () {
      var playlist = new spotify.Playlist('')
      playlist.should.have.deep.property('queries.entries').that.eql([])
    })

    it('should create a one-track playlist', function () {
      var playlist = new spotify.Playlist('test')
      playlist.should.have.deep.property('queries.entries[0].query', 'test')
    })

    it('should create a two-track playlist', function () {
      var playlist = new spotify.Playlist('test1\ntest2')
      playlist.should.have.deep.property('queries.entries[0].query', 'test1')
      playlist.should.have.deep.property('queries.entries[1].query', 'test2')
    })

    it('should ignore empty lines', function () {
      var playlist = new spotify.Playlist('test1\n\n\n\ntest2')
      playlist.should.have.deep.property('queries.entries[0].query', 'test1')
      playlist.should.have.deep.property('queries.entries[1].query', 'test2')
    })

    it('should create a sorted playlist', function () {
      var playlist = new spotify.Playlist('#ORDER BY POPULARITY\ntest1\ntest2')
      playlist.should.have.deep.property('queries.entries[0].query', 'test1')
      playlist.should.have.deep.property('queries.entries[1].query', 'test2')
      playlist.should.have.property('order', 'popularity')
    })

    it('should dispatch all queries', function () {
      var playlist = new spotify.Playlist('test1\ntest2')
      var promise = playlist.dispatch()
      return promise.should.eventually.be.instanceof(spotify.Collection)
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
      return promise.should.eventually.be.instanceof(spotify.Collection)
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
      return promise.should.eventually.be.an.instanceof(spotify.Collection)
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
      return promise.should.eventually.be.an.instanceof(spotify.Collection)
    })
  })

  describe('Collection', function () {
    it('should create an empty list', function () {
      var collection = new spotify.Collection()
      collection.entries.should.eql([])
    })

    it('should convert an entry into a singleton collection', function () {
      var entry = new spotify.Entry({}, 'test')
      var collection = new spotify.Collection(entry)
      collection.entries.should.eql([
        {
          query: 'test'
        }
      ])
    })

    it('should add an entry', function () {
      var entry = new spotify.Entry({}, 'test')
      var collection = new spotify.Collection()
      collection.add(entry)
      collection.entries.should.eql([
        {
          query: 'test'
        }
      ])
    })

    it('should store entries in the order they are added', function () {
      var foo = new spotify.Entry({}, 'foo')
      var bar = new spotify.Entry({}, 'bar')
      var collection = new spotify.Collection()
      collection.add(foo)
      collection.add(bar)
      collection.entries.should.eql([
        {
          query: 'foo'
        },
        {
          query: 'bar'
        }
      ])
    })

    it('should concatenate collections in the same order', function () {
      var foo = new spotify.Entry({}, 'foo')
      var bar = new spotify.Entry({}, 'bar')
      var baz = new spotify.Entry({}, 'baz')
      var collection1 = new spotify.Collection()
      var collection2 = new spotify.Collection()
      collection1.add(foo)
      collection1.add(bar)
      collection2.add(baz)
      var collection3 = collection1.concat(collection2)
      collection3.entries.should.eql([
        {
          query: 'foo'
        },
        {
          query: 'bar'
        },
        {
          query: 'baz'
        }
      ])
    })
  })
})
