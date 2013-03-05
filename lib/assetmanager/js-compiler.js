var fsExt = require('./fs-ext'),
    fs    = require('fs'),
    path  = require('path'),
    _     = require('underscore'),
    log   = require('./log');

module.exports = function(options, cache, production) {
  options.manifest = options.manifest || './assets/js/manifest.json';
  options.destination = options.destination || './public/js';

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

  function compile(file, files, callback) {
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
  }

  function init(err) {
    if (err) return log.error(err);

    // Recompile all when manifest file is updated in development
    if (!production) fsExt.watchFile(options.manifest, null, init);

    fs.readFile(options.manifest, function(err, data) {
      if (err) return log.error(err);

      var manifests = JSON.parse(data);
      if (manifests.length < 1) return log.error('No files in js manifest at ' + options.manifest);

      for (var file in manifests) {
        var sourcePath = path.dirname(options.manifest) + path.sep;
        var files = _.map(manifests[file], function(value) {
          return sourcePath + value;
        });
        file = options.destination + path.sep + file;

        compile(file, files, function(err, file) {
          if (err) return log.error(err);
          log.succes('js', 'compiled', file);
          cache.add(file);
        });

        // Watch all files in type for changes in development
        if (!production) {
          files.forEach(function(item) {
            fsExt.watchFile(item, [file, files], function(err, arg) {
              if (err) return log.error(err);

              compile(arg[0], arg[1], function(err, file) {
                if (err) return log.error(err);

                log.succes('js', 'compiled', file);
                cache.add(file);
              });
            });
          });
        }
      }
    });

  }

  init();
};