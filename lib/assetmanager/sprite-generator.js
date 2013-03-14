var fsExt = require('./fs-ext'),
    im    = require('imagemagick');

module.exports = function(options, cache, production, callback) {
  options.source      = options.source || './assets/img/sprite';
  options.destination = options.destination || './public/img/sprite.png';

  var generete = function(files, callback) {

    imArgs = files;
    imArgs.push('-append');
    // imArgs.push('-background transparent');
    imArgs.push(options.destination);

    console.log(imArgs.join(' '));

    im.convert(imArgs, function(err, stdout) {
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