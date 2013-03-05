var async = require('async'),
    _     = require('underscore'),
    fs    = require('fs'),
    fsExt = require('./fs-ext'),
    path  = require('path');

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

  // // On server start check if any images has changed
  // var checkEdits = function() {
  //   async.forEach(rawFiles, function(file, callback) {
  //     fs.stat(options.source + file, function(err, stat) {
  //       if (err) return callback(err);
  //       if (stat.isFile()) {
  //         var rawMTime = stat.mtime;
  //         fs.stat(options.destination + stripFW(file), function(err, stat) {
  //           var smashFile = true;
  //           if (!err && stat.isFile() && stat.mtime >= rawMTime) {
  //             smashFile = false;
  //           }
  //           if (smashFile) {
  //             smash(file);
  //           }
  //           callback(err);
  //         });
  //       }
  //     });
  //   }, function(err) {
  //     log.error(err);
  //   });
  // };

  // // Remove fireworks .fw extension on raw png files
  // var stripFW = function(file) {
  //   return file.replace('.fw', '');
  // };

  // // Compress raw jpg or png file using ImageOptim (imageoptim.com) and put it in the destination/public folder
  // var smash = function(file) {
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

  // var start = function() {
  //   rawFiles.forEach(function(file, index) {
  //     cache.add(options.destination + stripFW(file), '/img' + stripFW(file), options.source + file);
  //   });
  //   if (!production) {
  //     watch();
  //     checkEdits();
  //   }
  // };

  // Get path to all raw and compressed images
  var init = function() {

    async.parallel({
        raw: function(callback){
          fsExt.getFilesFromPath(options.source, function(err, files) {
            if (err) return callback(err);

            files = _(files).filter( function(file) {
              var ext = path.extname(file).replace('.','');
              return (_(options.extensions).indexOf(ext) !== -1);
            });
            callback(null, files);
          });
        },
        two: function(callback){
          fsExt.getFilesFromPath(options.destination, function(err, files) {
            if (err) return callback(err);

            files = _(files).filter( function(file) {
              var ext = path.extname(file).replace('.','');
              return (_(options.extensions).indexOf(ext) !== -1);
            });
            callback(null, files);
          });
        }
    },
    function(err, results) {
      if (err) return log.error(err);
      console.log(results);

    });
  };

  init();
};