// TODO: Watch folder for new files

/*
 * Autogenerate a sprite image based on all files in folder.
 * All images only needs to be saved i retina resolution.
 * Both a retina and an normal (half size) sprite will be generated.
 * Automatic create a css object with relevant positions and names.
 */

// Import packages
var fsExt = require('./fs-ext'),
    exec  = require('child_process').exec,
    _     = require('underscore'),
    im    = require('imagemagick'),
    async = require('async'),
    path  = require('path'),
    fs    = require('fs'),
    log   = require('./log');

var options, cache, production;

// Generate retina and normal resolution sprite images based on files
var generateImage = function(files, callback) {

  var nonRetinaImage = options.destination;

  var ext         = path.extname(nonRetinaImage),
      basename    = path.basename(nonRetinaImage, ext),
      dir         = path.dirname(nonRetinaImage);

      retinaImage = dir + '/' + basename + '@2x' + ext;

  // Retina image
  var commands = [
    '-matte', '-bordercolor', 'none', '-border', options.offset, //  spacing between images
    '-background', 'transparent',
    '+append',
    retinaImage
    ];
  commands = _.union(files, commands);
  im.convert(commands, function(err, stdout, stderr) {
    if (err) return callback(err);
    if (stderr) return callback(stderr);

    // Normal size (50%) sprite image
    im.convert([retinaImage, '-resize', '50%', nonRetinaImage], function(err) {
      callback(err, {retina: retinaImage, nonRetina: nonRetinaImage});
    });
  });

};

// Generate relevant css for sprite image
var generateCss = function(files, callback) {
  var css = {};
  var offset = 0;

  // Get width and height for all images
  getImagesMetaData(files, function(err, imagesMetaData) {
    if (err) return callback(err);

    var offset = 0;
    files.forEach(function(file) {

      var cssElement = path.basename(file, '.' + imagesMetaData[file].format.toLowerCase())
        .replace(' ', '-') // no whitespace in filename
        .replace('.fw', '') // remove fireworks extensions
        .split('_');

      var cssClass = cssElement[0];
      var cssPseudo;
      if (cssElement.length > 1) cssPseudo = ':' + cssElement[1];

      var cssObject = {
        xOffset: offset,
        width: imagesMetaData[file].width + 2 * options.offset,
        height: imagesMetaData[file].height + 2 * options.offset
      };

      if (!css[cssClass]) css[cssClass] = {};

      // Pseudo-class like :hover, :active
      if (cssPseudo) {
        css[cssClass][cssPseudo] = cssObject;

      // Normal css class
      } else {
        css[cssClass] = _.extend(css[cssClass], cssObject);
      }

      // Add space between images in sprite
      offset += imagesMetaData[file].width + options.offset * 2;
    });
    callback(null, css);
  });
};

// Get metadata like width and height from images
var getImagesMetaData = function(images, done) {
  var imagesMetaData = {};
  async.forEach(
  images,

  function(image, callback) {
    im.identify(image, function(err, features) {
      if (err) return callback(err);
      imagesMetaData[image] = features;
      callback();
    });
  },

  function(err) {
    if (err) return done(err);
    done(null, imagesMetaData);
  });
};

// Updated sprite when one image is changed
var watchImages = function(files) {
  async.forEach(
  files,

  function(file, callback) {
    fsExt.watchFile(file, files, function(err, files) {
      if (err) return log.error('sprite', err);

      async.parallel({
        image: function(callback) {
          generateImage(files, callback);
        },
        css: function(callback) {
          generateCss(files, callback);
        }
      },
      updated);
    });
    callback();
  },

  function(err) {
    log.error(err);
  });
};

// Callback function when sprite is updated
var updated = function(err, data) {};

var init = function() {
  fsExt.getFilesFromPath(options.source, function(err, files) {
    if (err) return log.error('sprite', err);

    files = _(files).filter(function(file) {
      var ext = path.extname(file).replace('.', '');
      return (_(options.extensions).indexOf(ext) !== -1);
    });

    // Only recompile sprite if the are any changes to the sprite images
    fsExt.isAnyFileNewerThan(files, options.destination, function(err, updates) {
      if (err) return log.error('sprite', err);

      if (updates) {
        async.parallel({
          image: function(callback) {
            generateImage(files, callback);
          },
          css: function(callback) {
            generateCss(files, callback);
          }
        },
        updated);
      } else {
        log.message('sprite', 'no changes', 'in any sprite since last run.');
      }
      watchImages(files);
    });
  });
};

module.exports.init = function(_options, _cache, _production) {
  options = {};
  options.source      = _options.source      || './assets/img/sprite';
  options.destination = _options.destination || './public/img/sprite.png';
  options.offset      = _options.offset      || 5;
  options.extensions  = _options.extensions  || ["jpg", "jpeg", "png", "gif"];

  cache = _cache;
  production = _production;

  init();
};

module.exports.updated = function(callback) {
  updated = callback;
};