/* global describe, it */
var chai = require('chai')
chai.should()

var spotify = require('../spotify.js')

describe('Playlist', function () {
  describe('Constructor', function () {
    it('should create empty playlist when passed empty string', function () {
      var playlist = new spotify.Playlist('')
      playlist.should.eql({
        tracks: []
      })
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

    it('should create sorted playlist', function () {
      var playlist = new spotify.Playlist('#ORDER BY POPULARITY\ntest1\ntest2')
      playlist.should.eql({
        tracks: ['test1', 'test2'],
        order: 'popularity'
      })
    })
  })
})
