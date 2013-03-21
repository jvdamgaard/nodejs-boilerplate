
// TODO: Only compile if changes detected

/*
 * Concat files by folder, minify them and put them in the public/static folder with a md5 checksum url for aggressive cache
 */

// Import packages
var fsExt = require('./fs-ext'),
    fs    = require('fs'),
    path  = require('path'),
    _     = require('underscore'),
    log   = require('./log');

var options, production, cache;

// Concat files into one file
var concat = function(destinationFile, files, callback) {

  var filesContent = [];

  var pending = files.length;
  files.forEach(function(file, index) {
    fs.readFile(file, 'utf8', function(err, str) {
      if (err) return callback(err);

      // Insert comment file ref to file for easier debugging
      var output = '/*\n';
      output += ' * ' + (new Array(file.length + 7).join('-')) + '\n';
      output += ' *    ' + file + '\n';
      output += ' * ' + (new Array(file.length + 7).join('-')) + '\n';
      output += ' */\n\n';
      output += str.toString();
      output += '\n\n\n\n';

      filesContent[index] = output;
      pending--;

      if (!pending) {
        var concattedContent = filesContent.join('');
        callback(null, destinationFile, concattedContent);

      }
    });

  });
};

// Minify js in production and write file to public/static
var compile = function(file, files, callback) {
  concat(file, files, function(err, file, content) {
    if (err) return callback(err);
    if (production) {
      content = uglify.minify(content, {
        fromString: true
      }).code;
    }

    fsExt.writeFile(file, content, function(err) {
      callback(err, file);
    });

  });
};

var init = function(err) {
  if (err) return log.error('js', err);

  // Recompile all when manifest file is updated in development
  if (!production) fsExt.watchFile(options.manifest, null, init);

  // Compile based on manifest json file
  fs.readFile(options.manifest, function(err, data) {
    if (err) return log.error(err);

    var manifests = JSON.parse(data);
    if (manifests.length < 1) return log.error('js', 'No files in js manifest at ' + options.manifest);

    for (var file in manifests) {
      var sourcePath = path.dirname(options.manifest) + '/';
      var files = _.map(manifests[file], function(value) {
        return sourcePath + value;
      });
      file = options.destination + '/' + file;

      compile(file, files, function(err, file) {
        if (err) return log.error('js', err);
        log.succes('js', 'compiled', file);
        cache.add(file);
      });

      // Watch all files in type for changes in development
      if (!production) {
        files.forEach(function(item) {
          fsExt.watchFile(item, [file, files], function(err, arg) {
            if (err) return log.error('js', err);

            compile(arg[0], arg[1], function(err, file) {
              if (err) return log.error('js', err);

              log.succes('js', 'compiled', file);
              cache.add(file);
            });
          });
        });
      }
    }
  });
};

module.exports.init = function(_options, _cache, _production) {
  options             = {};
  options.manifest    = _options.manifest    || './assets/js/manifest.json';
  options.destination = _options.destination || './public/js';

  cache = _cache;
  production = _production;

  init();
};