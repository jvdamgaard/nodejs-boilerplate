var async = require('async'),
    _     = require('underscore'),
    fs    = require('fs'),
    fsExt = require('./fs-ext'),
    path  = require('path'),
    log   = require('./log'),
    cache = require('./cache'),
    exec  = require('child_process').exec;

module.exports = function(options, cache, production) {
  options.source = options.source || './assets/img/for-public';
  options.destination = options.destination || './public';
  options.extensions = options.extensions || ["jpg", "jpeg", "png", "gif", "ico"];

  // var rawFiles = [];
  // var smashedFiles = [];

  // // Watch raw images and compress on change
  // var watch = function() {

  //   var last = new Date();

  //   log.message('img', 'watching', 'raw files');
  //   async.forEach(rawFiles, function(file, callback) {
  //     fs.watch(options.source + '/' + file, function(event) {
  //       var time = new Date();
  //       var diff = time - last;
  //       if (event === 'change' && diff > 1000) {
  //         last = time;
  //         smash(file);
  //       }
  //     });
  //     callback();
  //   });
  // };



  // // Compress raw jpg or png file using ImageOptim (imageoptim.com) and put it in the destination/public folder
  // var compress = function(file,callback) {
  //   var rawFile = options.source + file;
  //   var smashFile = options.destination + stripFW(file);

  //   fs.readFile(rawFile, function(err, data) {
  //     if (err) return log.error(err);
  //     mkdirp(path.dirname(smashFile), function(err) {
  //       if (err) return log.error(err);
  //       fs.writeFile(smashFile, data, function(err) {
  //         if (err) return log.error(err);

  //         // Send file to ImageOptim using command line
  //         exec('open -a ImageOptim.app ' + smashFile, function(err, stdout, stderr) {
  //           if (err) return log.error(err);
  //           if (stderr) return log.error(stderr);
  //           log.succes('img', 'smashed', smashFile);
  //         });
  //       });
  //     });
  //   });
  // };

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
        if (err) log.error(err);
        if (stderr) log.error(stderr);
      });
    }
    callback(null, file);
  };

  var addImageToCache = function(file, callback) {
    cache.add(file);
    callback(null, file);
  };

  // Get path to all raw and compressed images
  var init = function() {

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
          if (err) return log.error(err);
        }
      );

    });
  };

  init();
};