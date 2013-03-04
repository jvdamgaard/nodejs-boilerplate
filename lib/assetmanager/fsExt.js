var fs     = require('fs'),
    path   = require('path'),
    mkdirp = require('mkdirp');

// // Return array of all files in folder and subfolders
// var getFilesRecursive = function(dir, done) {
//   var files = [];
//   fs.readdir(dir, function(err, list) {
//     if (err) return done(err);

//     async.forEach(list, function(file, callback) {
//       file = dir + '/' + file;
//       fs.stat(file, function(err, stat) {
//         if (err) return callback(err);

//         // Recursive get files in subfolder
//         if (stat && stat.isDirectory()) {
//           getFilesRecursive(file, function(err, res) {
//             files = files.concat(res);
//             callback();
//           });
//         } else {
//           files.push(file);
//           callback();
//         }
//       });
//     }, function(err) {
//       done(err, files);
//     });
//   });
// };

// // Return array of all files in folder and subfolders relative to dir
// var getFiles = function(dir, callback) {
//   getFilesRecursive(dir, function(err, files) {
//     if (err) return callback(err);

//     files.forEach(function(file, i) {
//       files[i] = file.replace(dir, '');
//     });
//     callback(null, files);
//   });
// };

// // Get all folders recursive
// var getFolders = function(dir, done) {
//   var results = [];
//   fs.readdir(dir, function(err, list) {
//     if (err) return done(err);

//     async.forEach(list, function(item, callback) {
//       file = dir + '/' + item;
//       fs.stat(file, function(err, stat) {
//         if (err) return callback(err);

//         if (stat && stat.isDirectory()) {
//           results.push(item);
//         }
//         callback();
//       });
//     }, function(err) {
//       done(err, results);
//     });
//   });

// };

// // Read file content
// var getFile = function(file, callback) {
//   fs.readFile(file, 'utf8', function(err, str) {
//     if (err) return callback(err);
//     callback(null, str.toString());
//   });
// };

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

    fs.stat(file, function(err, stat) {
      if (err) return callback(err);

      var last = new Date();
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