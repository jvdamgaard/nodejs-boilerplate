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
        });
      });
    }

    callback(null, publicFile, file);
  };

  // Compress raw jpg or png file using ImageOptim (imageoptim.com) and put it in the destination/public folder
  var compressImage = function(file,callback) {

    var krakenTypes = ['jpg', 'jpeg', 'png', 'gif'];
    var ext = path.extname(file).replace('.','').toLowerCase();

    if (_.indexOf(krakenTypes, ext) === -1 || !options.KrakenAPI) return callback(null, file);

    // TODO: move settings to config.json
    var kraken = new Kraken(options.KrakenAPI);

    kraken.upload(file, function(status) {
      if (status.success) {
        fsExt.copyImageFromUrl(status.krakedURL, file, function(err) {
          if (err) return log.error('img', err);
          log.succes('img', 'optimized', 'squeezed ' + (Math.round(status.savedBytes/100)/10) +'kB (' + status.savedPercent + ') out of ' + file);
          callback(null, file);
        });
      } else {
        log.error('img', status.error);
        callback(null, file);
      }
    });


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

  var init = function() {
    compressImages();
  };

  return {
    compress: function() { init(); }
  };
};