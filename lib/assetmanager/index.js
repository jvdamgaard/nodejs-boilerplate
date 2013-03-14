// Import packages
var cache = require('./cache');

module.exports = function(options, production) {
  options = options || {};
  if (production !== false) {
    production = true;
  }
  options.less = options.less || {};
  options.img = options.img || {};
  options.js = options.js || {};


  var jsCompiler = require('./js-compiler')(options.js, cache, production);
  jsCompiler.compile();

  var lessCompiler = require('./less-compiler')(options.less, cache, production);
  lessCompiler.compile();

  var imageCompressor = require('./img-compressor')(options.img, cache, production);
  imageCompressor.compress();

  // require('./sprite-generator')(options.sprite, cache, production, function(err, imageData, css) {
  //   if (err) return log.error('sprite', err);
  //   // Save image file
  //   // Save less
  //   imageCompressor.recompress();
  //   lessCompiler.recompile();
  // });


  return {
    url: cache.url,
    middleware: function() {
      return cache.middleware;
    }
  };
};