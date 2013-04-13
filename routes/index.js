exports.index = function(req, res){
  res.render('index', {
    title: 'Node.js kickstarter'
  });
};

exports.test = function(req, res){
  res.render('test', {
    title: 'Test site'
  });
};
