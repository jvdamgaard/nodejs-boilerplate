var async  = require('async'),
    _      = require('underscore'),
    fs     = require('fs'),
    fsExt  = require('./fs-ext'),
    path   = require('path'),
    log    = require('./log'),
    cache  = require('./cache'),
    exec   = require('child_process').exec,
    Kraken = require('kraken');

module.exports = function(options, cache, production) {
  options.source             = options.source || './assets/img/for-public';
  options.destination        = options.destination || './public';
  options.extensions         = options.extensions || ["jpg", "jpeg", "png", "gif", "ico"];

  options.sprite             = options.sprite || {};
  options.sprite.source      = options.sprite.source || './assets/img/sprite';
  options.sprite.destination = options.sprite.destination || './public/img/sprites';

  var getPublicFile = function(file, callback) {
    var publicFile = file.replace('.fw.png','.png').replace(options.source,'');
    publicFile = options.destination + publicFile;
    callback(null, file, publicFile);
  };

  // On server start check if any images has changed
  var checkEdits = function(file, publicFile, callback) {
    fs.stat(file, function(err, stat) {
      if (err) return callback(err);
      if (!stat.isFile()) return callback(file + ' is not a file');

      var fileMTime = stat.mtime;
      fs.stat(publicFile, function(err, stat) {
        var edits = true;
        if (!err && stat.isFile() && stat.mtime >= fileMTime) {
          edits = false;
        }
        if (!edits) {
          addImageToCache(publicFile, function(err, publicFile) {
            callback('No edits');
          });

        } else {
          callback(null, file, publicFile);
        }

      });

    });
  };

  var watchImage = function(publicFile, file, callback) {
    if (!production) {
      fsExt.watchFile(publicFile, file, function(err, file) {
            async.waterfall([
              function(callback) {
                callback(null, file);
              },
              getPublicFile,
              fsExt.copyFile,
              compressImage,
              addImageToCache
            ], function(err, file) {
              if (err) return log.error(err);
              log.succes('img', 'compressed', file);
            });
      });
    }

    callback(null, publicFile, file);
  };

  // Compress raw jpg or png file using ImageOptim (imageoptim.com) and put it in the destination/public folder
  var compressImage = function(file,callback) {

    // Send file to ImageOptim using command line
    if (!production) {
      exec('open -a ImageOptim.app ' + file, function(err, stdout, stderr) {
        if (err) log.error('img', 'ImageOptim not installed on computer');
        if (stderr) log.error('img', 'ImageOptim not installed on computer');
      });
    }
    callback(null, file);


  };

  var addImageToCache = function(file, callback) {
    cache.add(file);
    callback(null, file);
  };

  // Get path to all raw and compressed images
  var compressImages = function() {

    fsExt.getFilesFromPath(options.source, function(err, files) {
      if (err) return callback(err);

      files = _(files).filter( function(file) {
        var ext = path.extname(file).replace('.','');
        return (_(options.extensions).indexOf(ext) !== -1);
      });

      async.forEach(files,
        function(file,done){
          async.waterfall([
            function(callback) {
              callback(null, file);
            },
            getPublicFile,
            watchImage,
            checkEdits,
            fsExt.copyFile,
            compressImage,
            addImageToCache
          ], function(err, file) {
            if (!err && err !== 'No edits' && file) log.succes('img', 'compressed', file);
            if (err === 'No edits') err = null;
            done(err);
          });
        },
        function(err){
          if (err) return log.error('img', err);
        }
      );

    });
  };

  var test = function() {

    var kraken = new Kraken({
      'user': 'jvdamgaard',
      'pass': '3kanter',
      'apikey': 'e259d750cf5a0fb55ff32f1fb5ea2cf5'
    });

    var image = './public/img/sprite.fw.png';

    kraken.upload(image, function(status) {
      if (status.success) {
        fsExt.copyImageFromUrl(status.krakedURL, './public/img/test/sprite.png', function(err) {
          log.succes('img', 'optimized', 'squeezed ' + status.savedBytes +' (' + status.savedPercent + ') out of [img]');
        });
      } else {
        log.error('img', 'kraken api', status.error);
      }
    });
  };

  var init = function() {
    compressImages();
    test();
  };

  init();
};