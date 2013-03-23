
// TODO: Watch folders for new files

/*
 * Copy all images from asset folder to public/static folder and compress them using Kraken.io
 */

// Modules
var async  = require('async'),
    _      = require('underscore'),
    fs     = require('fs'),
    fsExt  = require('./fs-ext'),
    path   = require('path'),
    log    = require('./log'),
    cache  = require('./cache'),
    Kraken = require('kraken');

var options, production, cache;

// Get path to public/static file based on file in assets
var getPublicFile = function(file, callback) {
  var publicFile = file.replace('.fw.png', '.png').replace(options.source, '');
  publicFile = options.destination + publicFile;
  callback(null, file, publicFile);
};

// Check if file in assets folder is newer than the public/static one
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

// In development wathc image for changes and recompress it
var watchImage = function(publicFile, file, callback) {
  if (!production) {
    fsExt.watchFile(publicFile, file, function(err, file) {
      if (err) return log.error('img', err);
      async.waterfall([

      function(callback) {
        callback(null, file);
      },
      getPublicFile,
      fsExt.copyFile,
      compressImage,
      addImageToCache], function(err, file) {
        if (err) return log.error(err);
      });
    });
  }

  callback(null, publicFile, file);
};

// Send image to Kraken.io API and download kraked image
module.exports.compress = compressImage = function(file, callback) {

  var krakenTypes = ['jpg', 'jpeg', 'png', 'gif'];
  var ext = path.extname(file).replace('.', '').toLowerCase();

  if (_.indexOf(krakenTypes, ext) === -1 || !options.KrakenAPI) return callback(null, file);

  var kraken = new Kraken(options.KrakenAPI);

  log.message('img', 'uploading', file + ' to Kraken.io API...');
  kraken.upload(file, function(status) {
    if (status.success) {
      fsExt.copyImageFromUrl(status.krakedURL, file, function(err) {
        if (err) return log.error('img', err);
        log.succes('img', 'optimized', 'squeezed ' + (Math.round(status.savedBytes / 10) / 100) + 'kB (' + status.savedPercent + ') out of ' + file + ': total size: ' + (Math.round(status.krakedSize / 10) / 100) + 'kb');
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

// Copy and compress all images from assets folder
var compressImages = function() {

  fsExt.getFilesFromPath(options.source, function(err, files) {
    if (err) return callback(err);

    // Filer out all non-images
    files = _(files).filter(function(file) {
      var ext = path.extname(file).replace('.', '');
      return (_(options.extensions).indexOf(ext) !== -1);
    });

    async.forEach(files,

    function(file, done) {
      async.waterfall([

      function(callback) {
        callback(null, file);
      },
      getPublicFile,
      watchImage,
      checkEdits,
      fsExt.copyFile,
      compressImage,
      addImageToCache], function(err, file) {
        if (err === 'No edits') err = null;
        done(err);
      });
    },

    function(err) {
      if (err) return log.error('img', err);
    });

  });
};

// Initialize module with options
module.exports.init = function(_options, _cache, _production) {
  options = {};
  options.source             = _options.source      || './assets/images';
  options.destination        = _options.destination || './public';
  options.extensions         = _options.extensions  || ["jpg", "jpeg", "png", "gif", "ico"];

  cache = _cache;
  production = _production;

  compressImages();

};