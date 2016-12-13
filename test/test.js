/* global describe, it */
var chai = require('chai')
chai.should()

var spotify = require('../spotify.js')

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

describe('Track', function () {
  it('should create an empty track', function () {
    var track = new spotify.Track('')
    track.should.eql({})
  })

  it('should create a single track', function () {
    var track = new spotify.Track('test')
    track.should.eql({
      query: 'test'
    })
  })
})
