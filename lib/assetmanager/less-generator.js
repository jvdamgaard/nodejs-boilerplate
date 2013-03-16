var fsExt = require('./fs-ext'),
    _     = require('underscore');

module.exports.generate = function(structure, file, callback) {

  var less = '.sprite {\n';

  for (var cssClass in structure) {
    less += '  &.' + cssClass + ':before {\n';
    less += '    width: ' + Math.round(structure[cssClass].width/2) + 'px;\n';
    less += '    height: ' + Math.round(structure[cssClass].height/2) + 'px;\n';
    less += '    margin-left: ' + Math.round(structure[cssClass].width/4) + 'px;\n';
    less += '    margin-top: ' + Math.round(structure[cssClass].height/4) + 'px;\n';
    less += '    background-position-x: ' + Math.round(structure[cssClass].xOffset/2) + 'px;\n';
    less += '  }\n';

    if (structure[cssClass][':active']) {
      structure[cssClass]['.active'] = structure[cssClass][':active'];
    }

    for (var pseudoClass in structure[cssClass]) {
      if (_.indexOf(pseudoClass, ':') === 0 || _.indexOf(pseudoClass, '.') === 0) {
        less += '  &.' + cssClass + pseudoClass +  ':before {\n';
        less += '    width: ' + Math.round(structure[cssClass][pseudoClass].width/2) + 'px;\n';
        less += '    height: ' + Math.round(structure[cssClass][pseudoClass].height/2) + 'px;\n';
        less += '    margin-left: ' + Math.round(structure[cssClass][pseudoClass].width/4) + 'px;\n';
        less += '    margin-top: ' + Math.round(structure[cssClass][pseudoClass].height/4) + 'px;\n';
        less += '    background-position-x: ' + Math.round(structure[cssClass][pseudoClass].xOffset/2) + 'px;\n';
        less += '  }\n';
      }
    }

  }
  less += '}';

  fsExt.writeFile(file, less, function(err) {
    callback(err);
  });
};