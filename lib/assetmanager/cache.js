var fs     = require('fs'),
    crypto = require('crypto');

// Object holding all concatted and minified files
var frontend = {},
    backend  = {};

// Add md5 checksum to files for better use of far expire cache. Used with middleware
module.exports.add = function(file) {
  var url = file.replace('./public', '');

  fs.readFile(file, function(err, data) {
    if (err) return log.error(err);

    var hash = crypto.createHash('md5').update(data).digest('hex');

    frontend[url] = '/' + hash + url;
    backend['/' + hash + url] = url;
  });
};

// Redirect md5 url'ed file to physical file
module.exports.middleware = function(req, res, next) {
  var url = req.url.split("?")[0].split("#")[0];
  var redirect = backend[url];
  if (redirect) {
    req.url = redirect;
  }
  next();
};

module.exports.url = function(url) {
  var cached = frontend[url];
  if (cached) return cached;
  return url;
};