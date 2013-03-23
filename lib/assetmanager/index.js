/*
 * Handle all assets and copy then to the public/static folder:
 *  - Images     : Compressed using lossy optimazation for best performance
 *  - Less       : Smarter structured css and concatted and compressed in one file
 *  - Javascript : Concat and compress all files in folders. Creating multiple js files.
 *  - Css sprite : Merge all images in sprite folder and automatic make retina and non-retina image.
 *                 Automatic style for sprites added to the less folder with classes based on image names
 *  - Cache      : Manager url to compiled files with a md5 checksum for use with aggresive cache.
 *
 *  All above is monitored live on development, which enables live editing.
 */

// Import packages
var cache                 = require('./cache'),
    log                   = require('./log'),
    path                  = require('path'),
    spriteLessGenerator   = require('./sprite-less-generator'),
    spriteGenerator       = require('./sprite-generator'),
    jsCompiler            = require('./js-compiler'),
    lessCompiler          = require('./less-compiler'),
    imageCompressor       = require('./img-compressor');

module.exports = function(options, production) {

  options = options || {};
  if (production !== false) {
    production = true;
  }
  options.less = options.less || {};
  options.img  = options.img  || {};
  options.js   = options.js   || {};

  jsCompiler.init(options.js, cache, production);
  lessCompiler.init(options.less, cache, production);
  imageCompressor.init(options.img, cache, production);
  spriteGenerator.init(options.sprite, cache, production);

  spriteGenerator.updated(spriteUpdated);

  return {
    url: cache.url,
    middleware: function() {
      return cache.middleware;
    }
  };
};

// Compress sprites and generate less
var spriteUpdated = function(err, data) {
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

      lessCompiler.recompile(function(err) {
        if (err) return log.error('less', err);
      });
    });
  };