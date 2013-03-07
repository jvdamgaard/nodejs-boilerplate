// Import packages


// Log errors and events i console
var log = function(type, color, header, content) {

  // Give string colors in console
  var Col = (function() {
    var Col = {};

    var setColor = function(color, content) {
      var reset = '\u001b[0m';
      return color + content + reset;
    };

    Col.red = function(content) {
      return setColor('\u001b[31m', content);
    };

    Col.green = function(content) {
      return setColor('\u001b[32m', content);
    };

    Col.yellow = function(content) {
      return setColor('\u001b[33m', content);
    };

    Col.blue = function(content) {
      return setColor('\u001b[34m', content);
    };

    return Col;

  }());

  type = type.toUpperCase();

  // Align message for better overview
  while (type.length < 6) {
    type += ' ';
  }
  while (header.length < 10) {
    header += ' ';
  }

  console.log(Col.blue(type) + ' ' + Col[color](header) + ' ' + content);
};

// Log errors in console
module.exports.error = function(type, err) {
  if (err) {
    log(type, 'red', 'error', err);
  }
};

module.exports.succes = function(type, header, msg) {
  if (msg) {
    log(type, 'green', header, msg);
  }
};

module.exports.message = function(type, header, msg) {
  if (msg) {
    log(type, 'yellow', header, msg);
  }
};