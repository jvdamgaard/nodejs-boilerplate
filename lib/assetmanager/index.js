// TODO: Convert json to less

// Import packages
var cache           = require('./cache'),
    log             = require('./log'),
    path            = require('path');

module.exports = function(options, production) {

  options = options || {};
  if (production !== false) {
    production = true;
  }
  options.less = options.less || {};
  options.img = options.img || {};
  options.js = options.js || {};

  var jsCompiler            = require('./js-compiler')(options.js, cache, production),
      lessCompiler          = require('./less-compiler')(options.less, cache, production),
      imageCompressor       = require('./img-compressor')(options.img, cache, production),
      spriteGenerator       = require('./sprite-generator')(options.sprite, cache, production),
      spriteLessGenerator   = require('./sprite-less-generator');

  jsCompiler.init();
  lessCompiler.init();
  imageCompressor.init();

  spriteGenerator.init()
    .updated(function(err, image, css) {
      if (err) return log.error('sprite', err);

      imageCompressor.compress(image, function(err) {
        log.error('sprite', err);
      });

      var spriteFile = options.less.source || './assets/less/style.less';
      spriteFile = path.dirname(spriteFile) + '/sprite.less';

      spriteLessGenerator.generate(css, image, spriteFile, function(err) {
        if (err) return log.error('sprite', err);
      });
    });

  return {
    url: cache.url,
    middleware: function() {
      return cache.middleware;
    }
  };
};