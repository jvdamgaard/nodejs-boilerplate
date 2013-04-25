describe('head/', function () {
  describe('fix.js', function () {

    it('should make sure that logging to console don´t throw an js error in all browsers', function () {
      expect(console).to.be.an(Object);
      expect(console.log).to.be.a('function');
    });

    it('should make sure, that forEach is a function on Array', function () {
      expect(Array.prototype.forEach).to.be.a('function');
    });

    it('should make sure, that Array.foreach() iterates an array', function () {
      var testArray = [0,1,2,3,4];
      var length = 0;
      testArray.forEach(function() {
        length++;
      });
      expect(length).to.equal(testArray.length);
    });

  });
});