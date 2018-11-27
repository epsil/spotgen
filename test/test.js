/* global describe, it */
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

var Artist = require('../lib/artist');
var Album = require('../lib/album');
var Generator = require('../lib/generator');
var Playlist = require('../lib/playlist');
var Queue = require('../lib/queue');
var Similar = require('../lib/similar');
var Track = require('../lib/track');
var Top = require('../lib/top');
var sort = require('../lib/sort');
var util = require('../lib/util');

describe('Spotify Playlist Generator', function() {
  this.timeout(999999);

  describe('Sorting', function() {
    it('should handle empty lists', function() {
      sort([], function(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
      }).should.eql([]);
    });

    it('should handle singleton lists', function() {
      sort([1], function(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
      }).should.eql([1]);
    });

    it('should stably sort the list', function() {
      sort([1, 4, 2, 8], function(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
      }).should.eql([1, 2, 4, 8]);
    });

    it('should work with an ascending comparison function', function() {
      sort(
        [1, 4, 2, 8],
        sort.ascending(function(x) {
          return x;
        })
      ).should.eql([1, 2, 4, 8]);
    });

    it('should work with a descending comparison function', function() {
      sort(
        [1, 4, 2, 8],
        sort.descending(function(x) {
          return x;
        })
      ).should.eql([8, 4, 2, 1]);
    });

    it('should preserve the order of duplicate elements', function() {
      sort([[1, 0], [4, 1], [2, 2], [4, 3], [8, 4]], function(a, b) {
        var x = a[0];
        var y = b[0];
        return x < y ? -1 : x > y ? 1 : 0;
      }).should.eql([[1, 0], [2, 2], [4, 1], [4, 3], [8, 4]]);
    });
  });

  describe('Utilities', function() {
    it('should clean up search strings', function() {
      util.normalize('  \u201Cshouldn\u2019t\u201D ').should.eql('"shouldn\'t"');
    });

    it('should remove noise', function() {
      util.stripNoise('1. artist - title (5:30)').should.eql('artist - title');
      util.stripNoise('test1 - test2 (string) test3').should.eql('test1 - test2');
    });

    it('should remove extra punctuation characters', function() {
      util.stripPunctuation("\u201Cshouldn't\u201D", "'").should.eql("shouldn't");
    });

    it('should convert punctuation to ASCII', function() {
      util.replacePunctuation('\u201Cshouldn\u2019t\u201D').should.eql('"shouldn\'t"');
    });

    it('should convert characters to ASCII', function() {
      util.toAscii('t\u00EAte-\u00E0-t\u00EAte \u2013 d\u00E9tente').should.eql('tete-a-tete - detente');
      util.toAscii('test1 \u25B2 test2').should.eql('test1  test2');
    });

    it('should remove extra whitespace', function() {
      util.stripWhitespace(' test1  - test2 ').should.eql('test1 - test2');
    });
  });

  describe('Queue', function() {
    it('should create an empty list', function() {
      var queue = new Queue();
      queue.queue.should.eql([]);
    });

    it('should add an entry', function() {
      var entry = new Track(null, 'test');
      var queue = new Queue();
      queue.add(entry);
      queue.should.have.deep.property('queue[0].entry', 'test');
    });

    it('should store entries in the order they are added', function() {
      var foo = new Track(null, 'foo');
      var bar = new Track(null, 'bar');
      var queue = new Queue();
      queue.add(foo);
      queue.add(bar);
      queue.should.have.deep.property('queue[0].entry', 'foo');
      queue.should.have.deep.property('queue[1].entry', 'bar');
    });

    it('should remove duplicates', function() {
      var foo1 = new Track(null, 'foo');
      foo1.title = foo1.entry;
      var foo2 = new Track(null, 'foo');
      foo2.title = foo2.entry;
      var bar = new Track(null, 'bar');
      bar.title = bar.entry;
      var queue = new Queue();
      queue.add(foo1);
      queue.add(foo2);
      queue.add(bar);
      return queue.dedup().then(function(queue) {
        queue.should.have.deep.property('queue[0].entry', 'foo');
        queue.should.have.deep.property('queue[1].entry', 'bar');
      });
    });

    it('should be sortable', function() {
      var foo = new Track(null, 'foo');
      var bar = new Track(null, 'bar');
      var queue = new Queue();
      queue.add(foo);
      queue.add(bar);
      queue.sort();
      queue.should.have.deep.property('queue[0].entry', 'bar');
      queue.should.have.deep.property('queue[1].entry', 'foo');
    });

    it('should be sortable with compare function', function() {
      var foo = new Track(null, 'foo');
      var bar = new Track(null, 'bar');
      var queue = new Queue();
      queue.add(foo);
      queue.add(bar);
      queue.sort(function(a, b) {
        return a.entry < b.entry ? -1 : a.entry > b.entry ? 1 : 0;
      });
      queue.should.have.deep.property('queue[0].entry', 'bar');
      queue.should.have.deep.property('queue[1].entry', 'foo');
    });

    it('should concatenate queues and preserve order', function() {
      var foo = new Track(null, 'foo');
      var bar = new Track(null, 'bar');
      var baz = new Track(null, 'baz');
      var queue1 = new Queue();
      var queue2 = new Queue();
      queue1.add(foo);
      queue1.add(bar);
      queue2.add(baz);
      var queue3 = queue1.concat(queue2);
      queue3.should.have.deep.property('queue[0].entry', 'foo');
      queue3.should.have.deep.property('queue[1].entry', 'bar');
      queue3.should.have.deep.property('queue[2].entry', 'baz');
    });

    it('should group on a property', function() {
      var foo = new Track(null, 'foo');
      var bar = new Track(null, 'bar');
      var baz = new Track(null, 'baz');
      foo.group = '1';
      bar.group = '2';
      baz.group = '1';
      var queue = new Queue();
      queue.add(foo);
      queue.add(bar);
      queue.add(baz);
      queue.group(function(entry) {
        return entry.group;
      });
      queue.should.have.deep.property('queue[0].entry', 'foo');
      queue.should.have.deep.property('queue[1].entry', 'baz');
      queue.should.have.deep.property('queue[2].entry', 'bar');
    });
  });

  describe('Track', function() {
    it('should create an empty entry', function() {
      var track = new Track(null, '');
      track.entry.should.eql('');
    });

    it('should create a single entry', function() {
      var track = new Track(null, 'test');
      track.entry.should.eql('test');
    });
  });

  describe('Album', function() {
    it('should create an empty entry', function() {
      var album = new Album(null, '');
      album.entry.should.eql('');
    });

    it('should create a single entry', function() {
      var album = new Album(null, 'Beach House - Depression Cherry');
      album.entry.should.eql('Beach House - Depression Cherry');
    });
  });

  describe('Artist', function() {
    it('should create an empty entry', function() {
      var artist = new Artist(null, '');
      artist.entry.should.eql('');
    });

    it('should create a single entry', function() {
      var artist = new Artist(null, 'Bowery Electric');
      artist.entry.should.eql('Bowery Electric');
    });
  });

  describe('Top', function() {
    it('should create an empty entry', function() {
      var top = new Top(null, '');
      top.entry.should.eql('');
    });

    it('should create a single entry', function() {
      var top = new Top(null, 'Bowery Electric');
      top.entry.should.eql('Bowery Electric');
    });
  });

  describe('Similar', function() {
    it('should create an empty entry', function() {
      var similar = new Similar(null, '');
      similar.entry.should.eql('');
    });

    it('should create a single entry', function() {
      var similar = new Similar(null, 'Bowery Electric');
      similar.entry.should.eql('Bowery Electric');
    });
  });

  describe('Playlist', function() {
    it('should create an empty entry', function() {
      var playlist = new Playlist(null, '');
      playlist.entry.should.eql('');
    });

    it('should create a single entry', function() {
      var playlist = new Playlist(
        null,
        'redditlistentothis:6TMNC59e1TuFFE48tJ9V2D',
        'redditlistentothis',
        '6TMNC59e1TuFFE48tJ9V2D'
      );
      playlist.entry.should.eql('redditlistentothis:6TMNC59e1TuFFE48tJ9V2D');
    });
  });

  describe('Generator', function() {
    it('should create empty playlist when passed empty string', function() {
      var generator = new Generator('');
      generator.should.have.deep.property('collection.entries.queue').that.eql([]);
    });

    it('should create a one-entry playlist', function() {
      var generator = new Generator('test');
      generator.should.have.deep.property('collection.entries.queue[0].entry', 'test');
    });

    it('should create a two-entry playlist', function() {
      var generator = new Generator('test1\ntest2');
      generator.should.have.deep.property('collection.entries.queue[0].entry', 'test1');
      generator.should.have.deep.property('collection.entries.queue[1].entry', 'test2');
    });

    it('should ignore empty lines', function() {
      var generator = new Generator('test1\n\n\n\ntest2');
      generator.should.have.deep.property('collection.entries.queue[0].entry', 'test1');
      generator.should.have.deep.property('collection.entries.queue[1].entry', 'test2');
    });

    it('should dispatch a single entry', function() {
      var generator = new Generator('The xx - Test Me');
      return generator.generate('list').then(function(str) {
        str.should.eql('The xx - Test Me');
      });
    });

    it('should not confuse album title with track title', function() {
      var generator = new Generator('Michael Jackson - Off the Wall');
      return generator.generate('list').then(function(str) {
        str.should.eql('Michael Jackson - Off the Wall');
      });
    });

    it('should order tracks by Spotify popularity', function() {
      var generator = new Generator('#order by popularity\ntest1\ntest2');
      generator.should.have.deep.property('collection.entries.queue[0].entry', 'test1');
      generator.should.have.deep.property('collection.entries.queue[1].entry', 'test2');
      generator.should.have.deep.property('collection.ordering', 'popularity');
    });

    it('should order tracks by Last.fm rating', function() {
      var generator = new Generator('#order by lastfm\ntest1\ntest2');
      generator.should.have.deep.property('collection.entries.queue[0].entry', 'test1');
      generator.should.have.deep.property('collection.entries.queue[1].entry', 'test2');
      generator.should.have.deep.property('collection.ordering', 'lastfm');
    });

    it('should create a playlist ordered by Spotify popularity', function() {
      var generator = new Generator(
        '#order by popularity\n' + 'Bowery Electric - Postscript\n' + 'Bowery Electric - Lushlife'
      );
      return generator.generate('list').then(function(str) {
        // FIXME: this is really brittle
        str.should.eql('Bowery Electric - Lushlife\n' + 'Bowery Electric - Postscript');
      });
    });

    it('should create an playlist ordered by name', function() {
      var generator = new Generator(
        '#order by name\n' + 'Bowery Electric - Postscript\n' + 'Bowery Electric - Lushlife'
      );
      return generator.generate('list').then(function(str) {
        // FIXME: this is really brittle
        str.should.eql('Bowery Electric - Lushlife\n' + 'Bowery Electric - Postscript');
      });
    });

    it('should parse comma-separated values', function() {
      var generator = new Generator(
        'spotify:track:3jZ0GKAZiDMya0dZPrw8zq,Desire Lines,Deerhunter,Halcyon Digest,1,6,404413,,\n' +
          'spotify:track:20DDHYR4vZqDwHyNFLwkXI,Saved By Old Times,Deerhunter,Microcastle,1,10,230226,,'
      );
      return generator.generate().then(function(str) {
        str.should.eql('spotify:track:3jZ0GKAZiDMya0dZPrw8zq\n' + 'spotify:track:20DDHYR4vZqDwHyNFLwkXI');
      });
    });

    it('should output comma-separated values', function() {
      var generator = new Generator(
        '#csv\n' + 'spotify:track:3jZ0GKAZiDMya0dZPrw8zq\n' + 'spotify:track:20DDHYR4vZqDwHyNFLwkXI'
      );
      return generator.generate().then(function(str) {
        str.should.eql(
          'sep=,\n' + 'spotify:track:3jZ0GKAZiDMya0dZPrw8zq,,,,,,,,\n' + 'spotify:track:20DDHYR4vZqDwHyNFLwkXI,,,,,,,,'
        );
      });
    });

    it('should parse extended M3U playlists', function() {
      var generator = new Generator(
        '#EXTM3U\n' +
          '#EXTINF:404,Desire Lines - Deerhunter\n' +
          'Deerhunter/Halcyon Digest/06 Desire Lines.mp3\n' +
          '#EXTINF:230,Saved By Old Times - Deerhunter\n' +
          'Deerhunter/Microcastle/10 Saved By Old Times.mp3'
      );
      return generator.generate('list').then(function(str) {
        str.should.eql('Deerhunter - Desire Lines\n' + 'Deerhunter - Saved By Old Times');
      });
    });

    it('should return an array of strings', function() {
      var generator = new Generator('spotify:track:4oNXgGnumnu5oIXXyP8StH\n' + 'spotify:track:7rAjeWkQM6cLqbPjZtXxl2');
      return generator.generate('array').then(function(str) {
        str.should.eql(['spotify:track:4oNXgGnumnu5oIXXyP8StH', 'spotify:track:7rAjeWkQM6cLqbPjZtXxl2']);
      });
    });

    it('should parse track URIs', function() {
      var generator = new Generator('spotify:track:4oNXgGnumnu5oIXXyP8StH\n' + 'spotify:track:7rAjeWkQM6cLqbPjZtXxl2');
      return generator.generate().then(function(str) {
        generator.should.have.deep.property('collection.entries.queue[0]').that.is.instanceof(Track);
        generator.should.have.deep.property('collection.entries.queue[1]').that.is.instanceof(Track);
        str.should.eql('spotify:track:4oNXgGnumnu5oIXXyP8StH\n' + 'spotify:track:7rAjeWkQM6cLqbPjZtXxl2');
      });
    });

    it('should parse track links', function() {
      var generator = new Generator(
        'https://open.spotify.com/track/4oNXgGnumnu5oIXXyP8StH\n' +
          'https://open.spotify.com/track/7rAjeWkQM6cLqbPjZtXxl2'
      );
      return generator.generate().then(function(str) {
        generator.should.have.deep.property('collection.entries.queue[0]').that.is.instanceof(Track);
        generator.should.have.deep.property('collection.entries.queue[1]').that.is.instanceof(Track);
        str.should.eql('spotify:track:4oNXgGnumnu5oIXXyP8StH\n' + 'spotify:track:7rAjeWkQM6cLqbPjZtXxl2');
      });
    });

    it('should parse #album entries', function() {
      var generator = new Generator('#album test');
      generator.should.have.deep.property('collection.entries.queue[0]').that.is.instanceof(Album);
    });

    it('should parse album URIs', function() {
      var generator = new Generator('spotify:album:5QIf4hNIAksV1uMCXHVkAZ');
      generator.should.have.deep.property('collection.entries.queue[0]').that.is.instanceof(Album);
      generator.should.have.deep.property('collection.entries.queue[0].id').that.eql('5QIf4hNIAksV1uMCXHVkAZ');
    });

    it('should parse album links', function() {
      var generator = new Generator('https://open.spotify.com/album/5QIf4hNIAksV1uMCXHVkAZ');
      generator.should.have.deep.property('collection.entries.queue[0]').that.is.instanceof(Album);
      generator.should.have.deep.property('collection.entries.queue[0].id').that.eql('5QIf4hNIAksV1uMCXHVkAZ');
    });

    it('should dispatch #album entries', function() {
      var generator = new Generator('#album Beach House - Depression Cherry');
      return generator.generate('list').then(function(str) {
        // FIXME: this is really brittle
        str.should.match(/^Beach House - Levitation/gi);
      });
    });

    it('should parse #artist entries', function() {
      var generator = new Generator('#artist Bowery Electric');
      generator.should.have.deep.property('collection.entries.queue[0]').that.is.instanceof(Artist);
    });

    it('should parse artist URIs', function() {
      var generator = new Generator('spotify:artist:56ZTgzPBDge0OvCGgMO3OY');
      generator.should.have.deep.property('collection.entries.queue[0]').that.is.instanceof(Artist);
      generator.should.have.deep.property('collection.entries.queue[0].id').that.eql('56ZTgzPBDge0OvCGgMO3OY');
    });

    it('should parse artist links', function() {
      var generator = new Generator('https://open.spotify.com/artist/56ZTgzPBDge0OvCGgMO3OY');
      generator.should.have.deep.property('collection.entries.queue[0]').that.is.instanceof(Artist);
      generator.should.have.deep.property('collection.entries.queue[0].id').that.eql('56ZTgzPBDge0OvCGgMO3OY');
    });

    it('should dispatch #artist entries', function() {
      var generator = new Generator('#artist Bowery Electric');
      return generator.generate('list').then(function(str) {
        // FIXME: this is really brittle
        str.should.match(/^Bowery Electric - Floating World/gi);
      });
    });

    it('should parse #top entries', function() {
      var generator = new Generator('#top Bowery Electric');
      generator.should.have.deep.property('collection.entries.queue[0]').that.is.instanceof(Top);
    });

    it('should dispatch #top entries', function() {
      var generator = new Generator('#top Bowery Electric');
      return generator.generate('list').then(function(str) {
        // FIXME: this is really brittle
        str.should.match(/^Bowery Electric - Floating World/gi);
      });
    });

    it('should parse #similar entries', function() {
      var generator = new Generator('#similar Bowery Electric');
      generator.should.have.deep.property('collection.entries.queue[0]').that.is.instanceof(Similar);
    });

    it('should dispatch #similar entries', function() {
      var generator = new Generator('#similar Bowery Electric');
      return generator.generate('list').then(function(str) {
        // FIXME: this is really brittle
        str.should.match(/^Flying Saucer Attack - My Dreaming Hill/gi);
      });
    });

    it('should parse #playlist entries', function() {
      var generator = new Generator('#playlist redditlistentothis:6TMNC59e1TuFFE48tJ9V2D');
      generator.should.have.deep.property('collection.entries.queue[0]').that.is.instanceof(Playlist);
      generator.should.have.deep.property('collection.entries.queue[0].owner.id').that.eql('redditlistentothis');
      generator.should.have.deep.property('collection.entries.queue[0].id').that.eql('6TMNC59e1TuFFE48tJ9V2D');
    });

    it('should parse playlist URIs', function() {
      var generator = new Generator('spotify:user:redditlistentothis:playlist:6TMNC59e1TuFFE48tJ9V2D');
      generator.should.have.deep.property('collection.entries.queue[0]').that.is.instanceof(Playlist);
      generator.should.have.deep.property('collection.entries.queue[0].owner.id').that.eql('redditlistentothis');
      generator.should.have.deep.property('collection.entries.queue[0].id').that.eql('6TMNC59e1TuFFE48tJ9V2D');
    });

    it('should parse playlist links', function() {
      var generator = new Generator('https://open.spotify.com/user/redditlistentothis/playlist/6TMNC59e1TuFFE48tJ9V2D');
      generator.should.have.deep.property('collection.entries.queue[0]').that.is.instanceof(Playlist);
      generator.should.have.deep.property('collection.entries.queue[0].owner.id').that.eql('redditlistentothis');
      generator.should.have.deep.property('collection.entries.queue[0].id').that.eql('6TMNC59e1TuFFE48tJ9V2D');
    });

    it('should dispatch #playlist entries', function() {
      var generator = new Generator('#playlist redditlistentothis:6TMNC59e1TuFFE48tJ9V2D');
      return generator.generate('list').then(function(str) {
        // FIXME: this is really brittle
        str.should.match(/^Drakkar Nowhere - Higher Now/gi);
      });
    });

    it('should dispatch multiple entries', function() {
      var generator = new Generator('The xx - Test Me\n' + 'Rage Against The Machine - Testify');
      return generator.generate('list').then(function(str) {
        // FIXME: this is really brittle
        str.should.eql('The xx - Test Me\n' + 'Rage Against The Machine - Testify');
      });
    });
  });
});
