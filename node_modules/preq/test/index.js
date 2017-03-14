var preq = require('../index');
var assert = require('assert');

// mocha defines to avoid JSHint breakage
/* global describe, it, before, beforeEach, after, afterEach */

describe('preq', function() {
    it('should retry', function() {
        this.timeout(20000);
        var tStart = new Date();
        return preq.get({
            // Some unreachable port
            uri: 'http://localhost:1/',
            retries: 4
        })
        .catch(function(e) {
            assert.equal(e.status, 504);
            var tDelta = new Date() - tStart;
            if (tDelta < 3150) {
                throw new Error("Does not look as if this actually retried!");
            }
        });
    });
    it('get enwiki front page', function() {
        return preq.get({
            uri: 'https://en.wikipedia.org/wiki/Main_Page',
        })
        .then(function(res) {
            assert.equal(res.status, 200);
            assert.equal(!!res.body, true);
            // Make sure content-location is not set
            assert.equal(!!res.headers['content-location'], false);
        });
    });
    it('get google.com, check for redirect', function() {
        return preq.get({
            uri: 'https://en.wikipedia.org/',
            retries: 2
        })
        .then(function(res) {
            assert.equal(res.status, 200);
            assert.equal(!!res.body, true);
            assert.equal(res.headers['content-location'],
                    'https://en.wikipedia.org/wiki/Main_Page');
        });
    });
    it('get google.com with query', function() {
        return preq.get({
            uri: 'http://google.com/',
            query: {
                q: 'foo'
            }
        })
        .then(function(res) {
            assert.equal(res.status, 200);
            assert.equal(!!res.body, true);
        });
    });
    it('get google.com, simple constructor style', function() {
        return preq('http://google.com/')
        .then(function(res) {
            assert.equal(res.status, 200);
            assert.equal(!!res.body, true);
        });
    });
    it('get google.com with query, constructor style', function() {
        return preq({
            method: 'get',
            uri: 'http://google.com/',
            query: {
                q: 'foo'
            }
        })
        .then(function(res) {
            assert.equal(res.status, 200);
            assert.equal(!!res.body, true);
        });
    });
    it('return buffer on user-supplied encoding', function() {
        return preq('http://google.com/', {encoding: null})
        .then(function(res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.constructor.name, 'Buffer');
        });
    });
    it('return string with no encoding', function() {
        return preq('http://google.com/')
        .then(function(res) {
            assert.equal(res.status, 200);
            assert.equal(typeof res.body, 'string');
        });
    });
    it('no content-encoding header for gzipped responses', function() {
        return preq({
            uri: 'https://en.wikipedia.org/api/rest_v1/page/html/Foobar',
            gzip: true
        }).then(function(res) {
            assert.equal(res.status, 200);
            assert.equal(res.headers['content-encoding'], undefined);
        });
    });
});

