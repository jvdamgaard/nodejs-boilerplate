var fsExt  = require('./fs-ext'),
    less   = require('less'),
    path   = require('path'),
    log    = require('./log'),
    mkdirp = require('mkdirp'),
    fs     = require('fs'),
    async  = require('async');

module.exports = function(options, cache, production) {

  options.optimization = options.optimization || 2;
  options.dumpLineNumbers = options.dumpLineNumbers || false;
  options.source = options.source || './assets/less/style.less';
  options.destination = options.destination || './public/css/style.css';

  var filesToWatch = [];

  var lessError = function(err) {
    var header = err.type + ' error';
    var description = err.message + ' - ' + err.filename + ' ' + err.line + ':' + err.column;
    log.message('less', header, description);
  };

  var watchFiles = function(callback) {

    // TODO: Better rank of files
    getFiles(path.dirname(options.source), function(err, files) {
      if (err) return log.error(err);

      files.forEach(function(file, index) {
        var ext = path.extname(file);

        // Filter less files and dont use the source file
        if (ext === '.less') {

          filesToWatch.push(path.dirname(options.source) + file);
        }
      });

      callback();

    });
  };

  // Compile less to css for use in frontend
  var compile = function(callback) {

    fsExt.readFile(options.source, function(err, lessStr) {
      if (err) return callback(err);

      if (!production) {
        fsExt.watchFile(options.source, null, function(err) {
          if (err) return log.error('less', err);
          init();
        });
      }

      // LESS parser
      var parser = new less.Parser({
        paths: [path.dirname(options.source)],
        filename: path.basename(options.source),
        optimization: options.optimization,
        dumpLineNumbers: options.dumpLineNumbers
      });

      parser.parse(lessStr, function(err, tree) {
        try {
          if (err) {
            return callback(err);
          }

          // watch all imported files
          if (!production) {
            var dir = path.dirname(options.source) + '/';
            async.forEach(tree.rules,
              function(rule,next){
                if (rule.path) {
                  fsExt.watchFile(dir + rule.path, null, function(err) {
                    if (err) return log.error('less', err);
                    init();
                  });
                }
                next();
              },
              function(err) {
                log.error('less', err);
              }
            );
          }

          // Parse non-minified css
          var css = tree.toCSS({
            compress: production,
            yuicompress: production
          });

          // Write
          mkdirp(path.dirname(options.destination), function(err) {
            if (err) return callback(err);

            fs.writeFile(options.destination, css, 'utf8', function(err) {
              if (err) return callback(err);

              cache.add(options.destination);
              callback();
            });
          });
        } catch (err) {
          return callback(err);
        }
      });
    });
  };

  var init = function() {

    compile(function(err) {
      if (err) return log.error('less', err);
      log.succes('less', 'compiled', options.destination);
    });
  };

  init();

};