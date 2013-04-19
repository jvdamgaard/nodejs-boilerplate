describe('Mocha and Expectjs', function () {
  it('should be running', function () {
    expect(true).to.be(true);
  });
});

describe('DSG stores api', function () {
  it('should be invoked', function (done) {
    $.getJSON('http://api.dsg.dk/WCF-Services/Stores.svc/GetStores/foetex', function(res) {
      expect(res).to.not.be.empty();
      done();
    });
  });
});