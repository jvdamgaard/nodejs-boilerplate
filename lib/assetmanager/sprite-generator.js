var fsExt = require('./fs-ext');

module.exports = function(options, cache, production, callback) {
  options.source      = options.source || './assets/img/sprite';
  options.destination = options.destination || './public/img/sprite.png';

  var generete = function(files, callback) {
    var Builder = require( 'node-spritesheet' ).Builder;

    var builder = new Builder({
        outputDirectory: './assets',
        outputImage: 'img/sprite.png',
        outputCss: 'less/sprite.less',
        selector: '.sprite',
        images: files
    });

    builder.build( function() {
        callback("Built from " + builder.images.length + " images" );
    });
  };


  var init = function() {
    fsExt.getFilesFromPath(options.source, function(err, files) {
      if (err) return callback(err);
      generete(files, function(err) {
        if (err) return log.error('sprite', err);
      });
    });
  };

   init();
};