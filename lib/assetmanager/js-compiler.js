/*
 * Concat files by folder, minify them and put them in the public/static folder with a md5 checksum url for aggressive cache
 */

// Import packages
var fsExt     = require('./fs-ext'),
    fs        = require('fs'),
    path      = require('path'),
    _         = require('underscore'),
    log       = require('./log');

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

var getManifests = function(manifest, callback) {
  fs.readFile(manifest, function(err, data) {
    if (err) return callback(err);

    var files = JSON.parse(data);
    if (files.length < 1) return callback('No files in js manifest at ' + options.manifest);
    callback(null, files);
  });
};

var createJsFile = function(destination, sources, callback) {
  var sourcePath = path.dirname(options.manifest) + '/';
  var files = _.map(sources, function(value) {
    return sourcePath + value;
  });
  file = options.destination + '/' + destination;

  fsExt.isAnyFileNewerThan(files, file, function(err, updates, args) {
    file = args[0];
    files = args[1];
    if (err) return callback(err);

    if (updates) {
      compile(file, files, function(err, file) {
        if (err) return callback(err);
        log.succes('js', 'compiled', file);
        callback(null, file, files);
      });
    } else {
      log.message('js', 'no changes', 'to ' + file + ' since last run.');
      callback(null, file, files);
    }
  }, [file, files]);
};

// Watch all files in type for changes in development
watchFiles = function(files, callback) {
  if (!production) {
    files.forEach(function(item) {
      fsExt.watchFile(item, [file, files], function(err, arg) {
        if (err) return callback(err);

        compile(arg[0], arg[1], function(err, file) {
          if (err) callback(err);

          log.succes('js', 'compiled', file);
          callback(null, file);
        });
      });
    });
  }
};

var init = function(err) {
  if (err) return log.error('js', err);

  // Recompile all when manifest file is updated in development
  if (!production) fsExt.watchFile(options.manifest, null, init);

  // Compile based on manifest json file
  getManifests(options.manifest, function(err, files) {
    if (err) return log.error(err);

    for (var file in files) {

      createJsFile(file, files[file], function(err, jsFile, jsFiles) {
        if (err) return log.error('js', err);
        cache.add(jsFile);

        watchFiles(jsFiles, function(err, jsFile) {
          if (err) return log.error('js', err);
          cache.add(jsFile);
        });
      });

    }
  });
};

module.exports.init = function(_options, _cache, _production) {
  options = {};
  options.manifest = _options.manifest || './assets/javascripts/manifest.json';
  options.destination = _options.destination || './public/js';

  cache = _cache;
  production = _production;

  init();
};