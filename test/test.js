/* global describe, it */
var chai = require('chai')
chai.should()

var spotify = require('../spotify.js')

describe('Playlist', function () {
  describe('Constructor', function () {
    it('should create empty playlist when passed empty string', function () {
      var playlist = new spotify.Playlist('')
      playlist.should.be.empty
    })

    it('should create one-track playlist', function () {
      var playlist = new spotify.Playlist('test')
      playlist.should.eql({})
    })
  })
})
