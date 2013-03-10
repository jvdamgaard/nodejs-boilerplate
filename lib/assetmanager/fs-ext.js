var fs     = require('fs'),
    path   = require('path'),
    mkdirp = require('mkdirp'),
    async  = require('async'),
    _      = require('underscore'),
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



  // Compress raw jpg or png file using ImageOptim (imageoptim.com) and put it in the destination/public folder
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

  var options = {
      host: url.parse(imageUrl).hostname,
      port: 80,
      path: url.parse(imageUrl).pathname
    };

 var request = http.get(options, function(res){
        var imagedata = '';
        res.setEncoding('binary');

        res.on('data', function(chunk){
            imagedata += chunk;
        });

        res.on('end', function(){
            fs.writeFile(destination, imagedata, 'binary', function(err){
                if (err) return callback(err);
                callback(null);
            });
        });

        res.on('error', function(err) {
          callback(err);
        });

    });
};