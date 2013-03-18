// TODO: Convert json to less

// Import packages
var cache                 = require('./cache'),
    log                   = require('./log'),
    path                  = require('path'),
    spriteLessGenerator   = require('./sprite-less-generator'),
    spriteGenerator       = require('./sprite-generator');

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
      imageCompressor       = require('./img-compressor')(options.img, cache, production);

  jsCompiler.init();
  lessCompiler.init();
  imageCompressor.init();

  spriteGenerator.init(options.sprite, cache, production);
  spriteGenerator.updated(function(err, data) {
      if (err) return log.error('sprite', err);

      imageCompressor.compress(data.image.retina, function(err) {
        log.error('sprite', err);
      });
      imageCompressor.compress(data.image.nonRetina, function(err) {
        log.error('sprite', err);
      });

      var spriteFile = options.less.source || './assets/less/style.less';
          spriteFile = path.dirname(spriteFile) + '/sprites.less';

      spriteLessGenerator.generate(data, spriteFile, function(err) {
        if (err) return log.error('sprite', err);
        lessCompiler.init();
      });
    });

  return {
    url: cache.url,
    middleware: function() {
      return cache.middleware;
    }
  };
};