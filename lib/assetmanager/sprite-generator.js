// TODO: Watch folder for new files
// TODO: Watch files

var fsExt = require('./fs-ext'),
    exec  = require('child_process').exec,
    _     = require('underscore'),
    im    = require('imagemagick'),
    async = require('async'),
    path  = require('path'),
    fs    = require('fs'),
    log   = require('./log');

module.exports = function(options, cache, production, callback) {
  options.source      = options.source      || './assets/img/sprite';
  options.destination = options.destination || './public/img/sprite.png';
  options.offset      = options.offset      || 10;
  options.extensions  = options.extensions  || ["jpg", "jpeg", "png", "gif"];

  var checkForUpdates = function(files, done) {

    // debug
    return done(null, true);

    fs.stat(options.destination, function(err, stat) {
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

  var generateImage = function(files, callback) {

    var commands = [
      '-matte', '-bordercolor', 'none', '-border', options.offset, //  spacing between images
      '-background', 'transparent',
      '+append',
      options.destination
      ];
    commands = _.union(files, commands);
    im.convert(commands, function(err, stdout) {
      callback(err, options.destination);
    });

  };

  var generateCss = function(files, callback) {
    var css = {};
    var offset = 0;
    getImagesMetaData(files, function(err, imagesMetaData) {
      if (err) return callback(err);

      var offset = 0;
      files.forEach(function(file) {

        offset += options.offset;

        var cssElement = path.basename(file, '.' + imagesMetaData[file].format.toLowerCase())
                         .replace(' ', '-')
                         .replace('.fw','')
                         .split('_');

        var cssClass = cssElement[0];
        var cssPseudo;
        if (cssElement.length>1) cssPseudo = ':' + cssElement[1];

        var cssObject = {
          xOffset: offset,
          width: imagesMetaData[file].width,
          height: imagesMetaData[file].height
        };

        if (!css[cssClass]) css[cssClass] = {};

        if (cssPseudo) {
          css[cssClass][cssPseudo] = cssObject;
        } else {
          css[cssClass] = _.extend(css[cssClass], cssObject);
        }

        offset += imagesMetaData[file].width + options.offset;
      });
      callback(null, css);
    });
  };

  var getImagesMetaData = function(images, done) {
    var imagesMetaData = {};
    async.forEach(
      images,
      function(image,callback){
        im.identify(image, function(err, features){
          if (err) return callback(err);
          imagesMetaData[image] = features;
          callback();
        });
      },
      function(err){
        if (err) return done(err);
        done(null, imagesMetaData);
      }
    );
  };

  var watchImages = function(files) {
    // async.forEach(
    //   files,
    //   function(file,callback){
    //     fsExt.watchFile(file, files, function(err, files) {
    //       if (err) return log.error('sprite', err);

    //       console.log('one file updated');

    //       async.parallel({
    //         image: function(callback){
    //           generateImage(files, callback);
    //         },
    //         css: function(callback){
    //           generateCss(files, callback);
    //         }
    //       },
    //       function(err, resp) {
    //         updated(err, resp.image, resp.css);
    //       });
    //     });
    //     callback();
    //   },
    //   function(err){
    //     log.error(err);
    //   }
    // );
  };

  // Callback function when sprite is updated
  var updated = function(err, image, css) {};

  var init = function() {
    fsExt.getFilesFromPath(options.source, function(err, files) {
      if (err) return done(err);

      files = _(files).filter( function(file) {
        var ext = path.extname(file).replace('.','');
        return (_(options.extensions).indexOf(ext) !== -1);
      });

      checkForUpdates(files, function(err, updates) {
        if (err) return log.error('sprite', err);
        if (updates) {
          async.parallel({
            image: function(callback){
              generateImage(files, callback);
            },
            css: function(callback){
              generateCss(files, callback);
            }
          },
          function(err, resp) {
            updated(err, resp.image, resp.css);
          });
        }
        watchImages(files);
      });
    });

    return {
      updated: function(callback) {
        updated = callback;
      }
    };

  };

  return {
    init: init
  };
};