// Import packages
var cache           = require('./cache'),
    log             = require('./log'),
    jsCompiler      = require('./js-compiler'),
    lessCompiler    = require('./less-compiler'),
    imageCompressor = require('./img-compressor'),
    spriteGenerator = require('./sprite-generator');

module.exports = function(options, production) {
  options = options || {};
  if (production !== false) {
    production = true;
  }
  options.less = options.less || {};
  options.img = options.img || {};
  options.js = options.js || {};

  jsCompiler(options.js, cache, production).init();
  lessCompiler(options.less, cache, production).init();
  imageCompressor(options.img, cache, production).init();

  spriteGenerator(options.sprite, cache, production).init()
    .updated(function(err, image, css) {
      if (err) return log.error('sprite', err);
      console.log(generatedImage);
      console.log(generatedCss);
      // imageCompressor.recompress();
      // lessCompiler.recompile();
    });

  return {
    url: cache.url,
    middleware: function() {
      return cache.middleware;
    }
  };
};