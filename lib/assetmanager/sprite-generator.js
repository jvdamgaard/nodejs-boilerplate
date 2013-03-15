var fsExt = require('./fs-ext'),
    exec  = require('child_process').exec,
    _     = require('underscore'),
    im    = require('imagemagick');

module.exports = function(options, cache, production, callback) {
  options.source      = options.source || './assets/img/sprite';
  options.destination = options.destination || './public/img/sprite.png';

  var generete = function(files, callback) {

    var commands = [
      '-matte', '-bordercolor', 'none', '-border', '1', // 2px spacing
      '-background', 'transparent',
      '+append',
      options.destination
      ];
    commands = _.union(files, commands);
    im.convert(commands, function(err, stdout) {
      if (err) return callback(err);
    });

  };


  var init = function(callback) {
    fsExt.getFilesFromPath(options.source, function(err, files) {
      if (err) return callback(err);
      generete(files, callback);
    });
  };

  return {
    generate: function(callback) {
      init(callback);
    }
  };
};