/*
 * Compile less files and put the compiled css file in the public/static folder
 */

// Import packages
var fsExt = require('./fs-ext'),
  less = require('less'),
  path = require('path'),
  log = require('./log'),
  mkdirp = require('mkdirp'),
  fs = require('fs'),
  async = require('async'),
  _ = require('underscore');

// Keep track of watched files -> avoid duplicates
var filesToWatch = [];

var options, production, cache;

// Wrapper for less syntax/parse errors
var lessError = function(err) {
  var header = err.type + ' error';
  var description = err.message + ' - ' + err.filename + ' ' + err.line + ':' + err.column;
  log.error('less', header + ': ' + description);
};

var watchSourceFile = function() {
  if (!production) {
    fsExt.watchFile(options.source, null, function(err) {
      if (err) return log.error('less', err);
      compile();
    });
  }
};

var createLessParser = function() {
  return new less.Parser({
    paths: [path.dirname(options.source)],
    filename: path.basename(options.source),
    optimization: options.optimization,
    dumpLineNumbers: options.dumpLineNumbers
  });
};

// Try to parse less and get all imported less files
var parseLess = function(lessStr, parser, callback) {
  parser.parse(lessStr, function(err, tree) {
    try {
      if (err) callback(err);
      var lessFiles = _.filter(tree.rules, function(rule) {
        return rule.path;
      });

      var dir = path.dirname(options.source) + '/';
      lessFiles = _.map(lessFiles, function(lessFile) {
        return dir + lessFile.path;
      });
      lessFiles.push(options.source);

      callback(null, lessFiles, tree);
    } catch (err) {
      return callback(err);
    }
  });
};

// Watch all less files and recompile on edit
var watchAllImportedFiles = function(lessFiles, callback) {
  if (!production) {
    async.forEach(lessFiles,

    function(lessFile, next) {
      fsExt.watchFile(lessFile, null, function(err) {
        if (err) return next(err);
        compile();
      });
      next();
    },
    callback);
  }
};

// Convert parsed less to css and write public/static file
var createCssFile = function(lessFiles, tree, callback) {
  fsExt.isAnyFileNewerThan(lessFiles, options.destination, function(err, updates) {
    if (err) return callback(err);

    if (updates) {

      // Parse css
      var css = tree.toCSS({
        compress: production,
        yuicompress: production
      });

      // Write
      mkdirp(path.dirname(options.destination), function(err) {
        if (err) return callback(err);

        fs.writeFile(options.destination, css, 'utf8', function(err) {
          if (err) return callback(err);
          log.succes('less','compiled', options.destination);
          callback();
        });
      });

    } else {
      log.message('less', 'no changes', 'since last run.');
      callback();
    }
  });
};

// Compile less to css for use in frontend
module.exports.recompile = compile = function(callback) {

  fsExt.readFile(options.source, function(err, lessStr) {
    if (err) return callback(err);

    watchSourceFile();

    parseLess(lessStr, createLessParser(), function(err, lessFiles, tree) {
      if (err) { return lessError(err);}

      watchAllImportedFiles(lessFiles, log.error);

      createCssFile(lessFiles, tree, function(err) {
        if (err) return log.error('less', err);
        cache.add(options.destination);
      });

    });
  });
};

module.exports.init = function(_options, _cache, _production) {
  options = {};
  options.optimization = _options.optimization || 2;
  options.dumpLineNumbers = _options.dumpLineNumbers || false;
  options.source = _options.source || './assets/less/style.less';
  options.destination = _options.destination || './public/css/style.css';

  cache = _cache;
  production = _production;

  compile();

};