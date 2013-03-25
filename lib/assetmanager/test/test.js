var expect = require('expect.js'),
    fsExt  = require('./../fs-ext');

describe('fsExt', function() {

  describe('.getFilesFromPath()', function() {
    it('should not return an error', function(done) {
      fsExt.getFilesFromPath(__dirname, done);
    });
    it('should return at least one file', function(done) {
      fsExt.getFilesFromPath(__dirname, function(err, files) {
        expect(files.length).to.be.greaterThan(0);
        done();
      });
    });
    it('should only return files from the given path', function(done) {
      fsExt.getFilesFromPath(__dirname, function(err, files) {
        expect(files[0].indexOf(__dirname)).to.equal(0);
        done();
      });
    });
  });

  describe('.readFile', function() {
    it('should not return an error', function(done) {
      fsExt.readFile(__dirname + '/test.js', done);
    });
    it('should return a string', function(done) {
      fsExt.readFile(__dirname + '/test.js', function(err, str) {
        expect(str).to.be.a('string');
        done();
      });
    });
    it('should return the files content', function(done) {
      fsExt.readFile(__dirname + '/test.js', function(err, str) {
        expect(str).to.contain("it('should return the files content'");
        done();
      });
    });
  });

});