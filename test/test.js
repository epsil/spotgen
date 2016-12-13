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
      playlist.should.eql({})
    })

    it('should create one-track playlist', function () {
      var playlist = new spotify.Playlist('test')
      playlist.should.eql({
        tracks: ['test']
      })
    })

    it('should create two-track playlist', function () {
      var playlist = new spotify.Playlist('test1\ntest2')
      playlist.should.eql({
        tracks: ['test1', 'test2']
      })
    })

    it('should ignore empty lines', function () {
      var playlist = new spotify.Playlist('test1\n\n\n\ntest2')
      playlist.should.eql({
        tracks: ['test1', 'test2']
      })
    })

    it('should create sorted playlist', function () {
      var playlist = new spotify.Playlist('#ORDER BY POPULARITY\ntest1\ntest2')
      playlist.should.eql({
        tracks: ['test1', 'test2'],
        order: 'popularity'
      })
    })
  })

  describe('Album', function () {
    it('should create an empty track', function () {
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
      return promise.should.eventually.be.instanceof(spotify.Entries)
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
      return promise.should.eventually.be.an.instanceof(spotify.Entry)
        .and.have.property('uri', 'spotify:track:1NZWiuy0mlnsrcYL2dhKt6')
    })
  })

  describe('Entries', function () {
    it('should create an empty list of entries', function () {
      var entries = new spotify.Entries()
      entries.entries.should.eql([])
    })

    it('convert an entry into a singleton entry list', function () {
      var entry = new spotify.Entry({}, 'test')
      var entries = new spotify.Entries(entry)
      entries.entries.should.eql([
        {
          query: 'test'
        }
      ])
    })

    it('should add an entry', function () {
      var entry = new spotify.Entry({}, 'test')
      var entries = new spotify.Entries()
      entries.addEntry(entry)
      entries.entries.should.eql([
        {
          query: 'test'
        }
      ])
    })

    it('should preserve order of entries', function () {
      var foo = new spotify.Entry({}, 'foo')
      var bar = new spotify.Entry({}, 'bar')
      var entries = new spotify.Entries()
      entries.addEntry(foo)
      entries.addEntry(bar)
      entries.entries.should.eql([
        {
          query: 'foo'
        },
        {
          query: 'bar'
        }
      ])
    })
  })
})
