var expect = require('expect.js'),
    fsExt  = require('./../fs-ext');

describe('fsExt', function() {
  describe('.getFilesFromPath()', function() {
    it('should not return an error', function(done) {
      fsExt.getFilesFromPath(__dirname, done);
    });
    it('should return at least one file', function() {
      fsExt.getFilesFromPath(__dirname, function(err, files) {
        expect(files.length).to.be.greaterThan(0);
      });
    });
    it('should only return files from the given path', function() {
      fsExt.getFilesFromPath(__dirname, function(err, files) {
        expect(files[0].indexOf(__dirname)).to.equal(0);
      });
    });
  });
});