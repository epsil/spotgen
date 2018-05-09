var expect = require('chai').expect;
var native = require('../..');

describe('cli-native:', function() {

  // to
  it('should return non-string type', function(done) {
    expect(native.to({})).to.eql({});
    done();
  });
  it('should convert to native true', function(done) {
    expect(native.to('true')).to.eql(true);
    done();
  });
  it('should convert to native false', function(done) {
    expect(native.to('false')).to.eql(false);
    done();
  });
  it('should convert to native null', function(done) {
    expect(native.to('null')).to.eql(null);
    done();
  });
  it('should convert to native undefined', function(done) {
    expect(native.to('undefined')).to.eql(undefined);
    done();
  });
  it('should convert to native number (positive integer)', function(done) {
    expect(native.to('10')).to.eql(10);
    done();
  });
  it('should convert to native number (negative integer)', function(done) {
    expect(native.to('-10')).to.eql(-10);
    done();
  });
  it('should convert to native number (float)', function(done) {
    expect(native.to('3.14')).to.eql(3.14);
    done();
  });
  it('should convert to native array (,)', function(done) {
    expect(native.to('a,b,c', ',')).to.eql(['a', 'b', 'c']);
    done();
  });
  it('should convert to native array (,)', function(done) {
    expect(native.to('1,2,3', ',')).to.eql([1,2,3]);
    done();
  });
  it('should convert to native object (json)', function(done) {
    expect(native.to('{"arr":[1,2,3]}', null, true))
      .to.eql({arr: [1,2,3]});
    done();
  });
  it('should throw error on malformed json', function(done) {
    function fn() {
      return native.to('{arr:[1,2,3]}', null, true)
    }
    expect(fn).throws(Error);
    done();
  });
  it('should convert to string', function(done) {
    expect(native.to('value')).to.eql('value');
    done();
  });

  //from
  it('should convert to string true', function(done) {
    expect(native.from(true)).to.eql('true');
    done();
  });
  it('should convert to string false', function(done) {
    expect(native.from(false)).to.eql('false');
    done();
  });
  it('should convert to string null', function(done) {
    expect(native.from(null)).to.eql('null');
    done();
  });
  it('should convert to string undefined', function(done) {
    expect(native.from(undefined)).to.eql('undefined');
    done();
  });
  it('should convert to string number', function(done) {
    expect(native.from(10)).to.eql('10');
    done();
  });
  it('should convert to string array (,)', function(done) {
    expect(native.from(['a,b,c'], ',')).to.eql('a,b,c');
    done();
  });
  it('should convert to string object (json)', function(done) {
    expect(native.from({arr: [1,2,3]}, null, true))
      .to.eql('{"arr":[1,2,3]}');
    done();
  });
  it('should convert to string', function(done) {
    expect(native.from('value')).to.eql('value');
    done();
  });
})
