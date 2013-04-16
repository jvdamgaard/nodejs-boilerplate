
// TODO: Watch folders for new files

/*
 * Copy all static files from asset folder to public/static
 */

// Modules
var async  = require('async'),
    _      = require('underscore'),
    fs     = require('fs'),
    fsExt  = require('./fs-ext'),
    path   = require('path'),
    log    = require('./log'),
    cache  = require('./cache');

var options, production, cache;

// Watch
// Add to cache

var copyFiles = function() {
  async.forEach(
    options,
    function(static,next){
      fsExt.getFilesFromPath(static.source, function(err, files) {
        if (err) return next(err);
        async.forEach(
          files,
          function(file,callback){
            fsExt.copyFile(file, file.replace(static.source, static.destination), function(err, file) {
              callback(err);
            });
          },
          function(err) {
            if (err) return next(err);
            log.succes('static', 'copied', 'all files from ' + static.source + ' to ' + static.destination);
            next();
          }
        );
      });
    },
    function(err){
      log.error('static', err);
    }
  );
};

// Initialize module with options
module.exports.init = function(_options, _cache, _production) {
  options = _options || [];
  options.font = options.font || {};
  options.font.source             = options.font.source      || './assets/font';
  options.font.destination        = options.font.destination || './public/font';

  cache = _cache;
  production = _production;

  copyFiles();

};