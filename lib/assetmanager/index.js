// Import packages
var less = require('less'),
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  uglify = require('uglify-js'),
  exec = require('child_process').exec,
  crypto = require('crypto'),
  async = require('async'),
  imagemagick = require('imagemagick'),
  _ = require('underscore'),
  fsExt = require('./fs-ext'),
  log = require('./log'),
  cache = require('./cache');

// Return array of all files in folder and subfolders
var getFilesRecursive = function(dir, done) {
  var files = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);

    async.forEach(list, function(file, callback) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (err) return callback(err);

        // Recursive get files in subfolder
        if (stat && stat.isDirectory()) {
          getFilesRecursive(file, function(err, res) {
            files = files.concat(res);
            callback();
          });
        } else {
          files.push(file);
          callback();
        }
      });
    }, function(err) {
      done(err, files);
    });
  });
};

// Return array of all files in folder and subfolders relative to dir
var getFiles = function(dir, callback) {
  getFilesRecursive(dir, function(err, files) {
    if (err) return callback(err);

    files.forEach(function(file, i) {
      files[i] = file.replace(dir, '');
    });
    callback(null, files);
  });
};

// Get all folders recursive
var getFolders = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);

    async.forEach(list, function(item, callback) {
      file = dir + '/' + item;
      fs.stat(file, function(err, stat) {
        if (err) return callback(err);

        if (stat && stat.isDirectory()) {
          results.push(item);
        }
        callback();
      });
    }, function(err) {
      done(err, results);
    });
  });

};

// Read file content
var getFile = function(file, callback) {
  fs.readFile(file, 'utf8', function(err, str) {
    if (err) return callback(err);
    callback(null, str.toString());
  });
};

// Compress images in assets folder using ImageOptim (http://imageoptim.com/)
var imageCompressor = function(options, production) {
  options.source = options.source || './assets/img';
  options.destination = options.destination || './public/img';

  var rawFiles = [];
  var smashedFiles = [];

  // Get path to all raw and compressed images
  var init = function() {
    var pending = 2;
    getFiles(options.source, function(err, files) {
      if (err) return log.error(err);
      files.forEach(function(file, index) {
        var ext = path.extname(file);
        if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
          rawFiles.push(file);
        }
      });
      if (!--pending) {
        start();
      }
    });
    getFiles(options.destination, function(err, files) {
      if (err) return log.error(err);
      smashedFiles = files;
      if (!--pending) {
        start();
      }
    });
  };

  var start = function() {
    rawFiles.forEach(function(file, index) {
      cache.add(options.destination + stripFW(file), '/img' + stripFW(file), options.source + file);
    });
    if (!production) {
      watch();
      checkEdits();
    }
  };

  // Watch raw images and compress on change
  var watch = function() {

    var last = new Date();

    log.message('img', 'watching', 'raw files');
    async.forEach(rawFiles, function(file, callback) {
      fs.watch(options.source + '/' + file, function(event) {
        var time = new Date();
        var diff = time - last;
        if (event === 'change' && diff > 1000) {
          last = time;
          smash(file);
        }
      });
      callback();
    });
  };

  // On server start check if any images has changed
  var checkEdits = function() {
    async.forEach(rawFiles, function(file, callback) {
      fs.stat(options.source + file, function(err, stat) {
        if (err) return callback(err);
        if (stat.isFile()) {
          var rawMTime = stat.mtime;
          fs.stat(options.destination + stripFW(file), function(err, stat) {
            var smashFile = true;
            if (!err && stat.isFile() && stat.mtime >= rawMTime) {
              smashFile = false;
            }
            if (smashFile) {
              smash(file);
            }
            callback(err);
          });
        }
      });
    }, function(err) {
      log.error(err);
    });
  };

  // Remove fireworks .fw extension on raw png files
  var stripFW = function(file) {
    return file.replace('.fw', '');
  };

  // Compress raw jpg or png file using ImageOptim (imageoptim.com) and put it in the destination/public folder
  var smash = function(file) {
    var rawFile = options.source + file;
    var smashFile = options.destination + stripFW(file);

    fs.readFile(rawFile, function(err, data) {
      if (err) return log.error(err);
      mkdirp(path.dirname(smashFile), function(err) {
        if (err) return log.error(err);
        fs.writeFile(smashFile, data, function(err) {
          if (err) return log.error(err);

          // Send file to ImageOptim using command line
          exec('open -a ImageOptim.app ' + smashFile, function(err, stdout, stderr) {
            if (err) return log.error(err);
            if (stderr) return log.error(stderr);
            log.succes('img', 'smashed', smashFile);
          });
        });
      });
    });

  };

  init();
};

module.exports = function(options, production) {
  options = options || {};
  if (production !== false) {
    production = true;
  }
  options.less = options.less || {};
  options.img = options.img || {};
  options.js = options.js || {};

  // LESS
  require('./less-compiler')(options.less, cache, production);

  // img
  require('./img-compressor')(options.img, cache, production);

  // js
  require('./js-compiler')(options.js, cache, production);

  return {
    url: cache.url,
    'middleware': function() {
      return cache.middleware;
    }
  };
};