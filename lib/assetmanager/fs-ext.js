var fs     = require('fs'),
    path   = require('path'),
    mkdirp = require('mkdirp'),
    async  = require('async'),
    _      = require('underscore'),
    https   = require('https'),
    http   = require('http'),
    url    = require('url');

var watchedFiles = [];

// Return array of all files in folder and subfolders
module.exports.getFilesFromPath = getFilesFromPath = function(dir, done) {
  var files = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);

    async.forEach(list, function(file, callback) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (err) return callback(err);

        // Recursive get files in subfolder
        if (stat && stat.isDirectory()) {
          getFilesFromPath(file, function(err, res) {
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

// Read file content
module.exports.readFile = function(file, callback) {

  fs.readFile(file, 'utf8', function(err, str) {
    if (err) return callback(err);

    callback(null, str.toString());
  });
};

module.exports.writeFile = function(file, content, callback) {

    mkdirp(path.dirname(file), function(err) {
      if (err) return callback(err);

      fs.writeFile(file, content, 'utf8', function(err) {
        callback(err);
      });
    });

  };

module.exports.watchFile = function(file, returnVal, callback) {

    if (_.indexOf(watchedFiles, file) !== -1) return;

    fs.stat(file, function(err, stat) {
      if (err) return callback(err);

      var last = new Date();

      watchedFiles.push(file);

      fs.watch(file, function(event) {
        var time = new Date();
        var diff = time - last;
        if (event === 'change' && diff > 1000) {
          last = time;
          callback(null, returnVal);
        }
      });
    });
  };

module.exports.copyFile = function(from,to,callback) {

    // TODO: async
    fs.readFile(from, function(err, data) {
      if (err) return callback(err);

      mkdirp(path.dirname(to), function(err) {
        if (err) return callback(err);

        fs.writeFile(to, data, function(err) {
          callback(err, to);
        });
      });
    });
  };

module.exports.copyImageFromUrl = function(imageUrl, destination, callback) {

  var protocol = http;
  if (imageUrl.toLowerCase().indexOf('https') === 0) {
    protocol = https;
  }

  mkdirp(path.dirname(destination), function(err) {
    if (err) return callback(err);

    var file = fs.createWriteStream(destination);
    var request = protocol.get(imageUrl, function(response) {
      response.on('end', callback);
      response.on('error', callback);
      response.pipe(file);
    });
  });
};

module.exports.isAnyFileNewerThan = function(files, checkFile, done) {

    fs.stat(checkFile, function(err, stat) {
      if (!stat.isFile()) return done(null, true);
      if (err) return done(err);

      var fileMTime = stat.mtime;
      var updates = false;
      async.forEach(
        files,
        function(file,callback){
          fs.stat(file, function(err, stat) {
            if (err) return callback(err);
            if (!stat.isFile()) return callback(file + ' is not a file');
            if (stat.mtime > fileMTime) updates = true;
            callback();
          });
        },
        function(err){
          done(err, updates);
        }
      );

    });
  };