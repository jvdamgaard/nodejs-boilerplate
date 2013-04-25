describe('head/', function () {

  describe('inheritance.js', function () {

    describe('First order object', function () {

      it('should create `create` as global functions', function () {
        expect(window.create).to.be.a('function');
      });

      var RootEl = create();

      it('should be an object', function () {
        expect(RootEl).to.be.an(Object);
      });

      it('should have inheritance attributes', function() {
        expect(RootEl).to.have.property('set');
        expect(RootEl).to.have.property('inheritsFrom');
        expect(RootEl).to.have.property('instanceOf');
      });

      describe('Second order object', function () {

        it('should create `extend` as global functions', function () {
          expect(window.extend).to.be.a('function');
        });

        var SecondEl = extend(RootEl);

        it('should inherit from the first order object', function () {
          expect(SecondEl.instanceOf()).to.equal(RootEl);
        });

      });

    });

  });

});