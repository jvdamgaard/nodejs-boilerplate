var fsExt = require('./fs-ext'),
    _     = require('underscore'),
    im    = require('imagemagick'),
    cache = require('./cache');

var spriteMixin = function(width, height, xOffset) {
  return '.sprite(' + width + ',' + height + ',' + xOffset +');';
};

module.exports.generate = function(tree, image, lessFile, callback) {

  cache.add(image, function(url) {

    im.identify(image, function(err, features){
      if (err) return callback(err);

      var less = '.sprite {\n';
      less    += '  background-image: url(' + url + ');\n';
      less    += '  background-size: ' + Math.round(features.width/2) + 'px ' + Math.round(features.height/2) + 'px;\n';

      for (var cssClass in tree) {
        less += '  &.' + cssClass + ':before {\n';
        less += '    ' + spriteMixin(Math.round(tree[cssClass].width/2), Math.round(tree[cssClass].height/2), Math.round(tree[cssClass].xOffset/2)) + '\n';
        less += '  }\n';

        if (tree[cssClass][':active']) {
          tree[cssClass]['.active'] = tree[cssClass][':active'];
        }

        for (var pseudoClass in tree[cssClass]) {
          if (_.indexOf(pseudoClass, ':') === 0 || _.indexOf(pseudoClass, '.') === 0) {
            less += '  &.' + cssClass + pseudoClass +  ':before {\n';
            less += '    ' + spriteMixin(Math.round(tree[cssClass][pseudoClass].width/2), Math.round(tree[cssClass][pseudoClass].height/2), Math.round(tree[cssClass][pseudoClass].xOffset/2)) + '\n';
            less += '  }\n';
          }
        }

      }
      less += '}';

      fsExt.writeFile(lessFile, less, function(err) {
        callback(err);
      });
    });

  });
};