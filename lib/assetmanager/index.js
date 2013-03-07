// Import packages
var cache = require('./cache');

module.exports = function(options, production) {
  options = options || {};
  if (production !== false) {
    production = true;
  }
  options.less = options.less || {};
  options.img = options.img || {};
  options.js = options.js || {};

  require('./less-compiler')(options.less, cache, production);
  require('./img-compressor')(options.img, cache, production);
  require('./js-compiler')(options.js, cache, production);

  return {
    url: cache.url,
    middleware: function() {
      return cache.middleware;
    }
  };
};