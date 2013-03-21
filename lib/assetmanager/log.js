/*
 * Log messages to the console
 */


// Log formatted messages in the console
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

    Col.none = function(content) {
      return content;
    };

    return Col;

  }());

  type = type.toUpperCase();

  // Align message for better overview
  while (type.length < 7) {
    type += ' ';
  }
  while (header.length < 14) {
    header += ' ';
  }

  console.log(Col.blue(type) + ' ' + Col[color](header) + ' ' + content);
};

// Log errors
module.exports.error = function(type, err) {
  if (err) {
    log(type, 'red', 'error', err);
  }
};

// Log succes messages
module.exports.succes = function(type, header, msg) {
  if (msg) {
    log(type, 'green', header, msg);
  }
};

// Log a message
module.exports.message = function(type, header, msg) {
  if (msg) {
    log(type, 'none', header, msg);
  }
};