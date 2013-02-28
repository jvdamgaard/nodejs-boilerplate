// Import packages
var less = require('less'),
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  uglify = require('uglify-js'),
  exec = require('child_process').exec,
  crypto = require('crypto'),
  async = require('async'),
  imagemagick = require('imagemagick');

// Object holding errors for use outside package
var errors = {
  less: [],
  js: [],
  img: []
};

// Object holding all concatted and minified files
var cache = {
  frontend: {},
  backend: {}
};

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
    while(type.length < 6) {
      type += ' ';
    }
    while(header.length < 10) {
      header += ' ';
    }

    console.log(Col.blue(type) + ' ' + Col[color](header) + ' ' + content);
  };

// Log errors in console
var error = function(err) {
    if(err) {
      log('error', 'red', 'error', err);
    }
  };

// Return array of all files in folder and subfolders
function searchForFiles(pattern, dir, done) {
    var files = [];
    fs.readdir(dir, function(err, list) {
      if(err) return done(err);

      async.forEach(list, function(file, callback) {
        file = dir + '/' + file;
        fs.stat(file, function(err, stat) {
          if(err) return callback(err);

          // Recursive get files in subfolder
          if(stat && stat.isDirectory()) {
            searchForFiles(pattern, file, function(err, res) {
              files = files.concat(res);
              callback();
            });
          } else {
            if (!pattern || file.indexOf(pattern) !== -1) files.push(file);
            callback();
          }
        });
      }, function(err) {
        done(err, files);
      });
    });
  }

// Return array of all files in folder and subfolders
var getFilesRecursive = function(dir, done) {
    var files = [];
    fs.readdir(dir, function(err, list) {
      if(err) return done(err);

      async.forEach(list, function(file, callback) {
        file = dir + '/' + file;
        fs.stat(file, function(err, stat) {
          if(err) return callback(err);

          // Recursive get files in subfolder
          if(stat && stat.isDirectory()) {
            getFilesRecursive(file, function(err, res) {
              files = files.concat(res);
              callback();
            });
          } else {
            files.push(file);
            callback();
          }
        });
      }, function(err) {
        done(err, files);
      });
    });
  };

// Return array of all files in folder and subfolders relative to dir
var getFiles = function(dir, callback) {
    getFilesRecursive(dir, function(err, files) {
      if(err) return callback(err);

      files.forEach(function(file, i) {
        files[i] = file.replace(dir, '');
      });
      callback(null, files);
    });
  };

// Get all folders recursive
var getFolders = function(dir, done) {
    var results = [];
    fs.readdir(dir, function(err, list) {
      if(err) return done(err);

      async.forEach(list, function(item, callback) {
        file = dir + '/' + item;
        fs.stat(file, function(err, stat) {
          if(err) return callback(err);

          if(stat && stat.isDirectory()) {
            results.push(item);
          }
          callback();
        });
      }, function(err) {
        done(err, results);
      });
    });

  };

// Read file content
var getFile = function(file, callback) {
    fs.readFile(file, 'utf8', function(err, str) {
      if(err) return callback(err);
      callback(null, str.toString());
    });
  };

// Handle compiling of less files
var lessCompressor = function(options, production) {

    options.optimization = options.optimization || 2;
    options.dumpLineNumbers = options.dumpLineNumbers || false;
    options.source = options.source || './assets/less/style.less';
    options.destination = options.destination || './public/css/style.css';

    var filesToWatch = [];

    var lessError = function(err) {
        var header = err.type + ' error';
        var description = err.message + ' - ' + err.filename + ' ' + err.line + ':' + err.column;
        log('less', 'red', header, description);
        errors.less.push(err);
      };

    // Create the main style.less file which imports all less files i assets folders
    var createMaster = function(callback) {

        // TODO: Better rank of files
        getFiles(path.dirname(options.source), function(err, files) {
          if(err) return error(err);

          var filesToImport = [];
          files.forEach(function(file, index) {
            var ext = path.extname(file);

            // Filter less files and dont use the source file
            if(ext === '.less' && path.basename(file) !== path.basename(options.source)) {

              filesToWatch.push(path.dirname(options.source) + file);

              // Remove beginning slash
              if(file.substr(0, 1) === '/') {
                file = file.substr(1, file.length - 1);
              }
              filesToImport.push(file);
            }
          });

          filesToImport = sortFiles(filesToImport);

          // Create the actual content for the main style.less file
          var content = '';
          filesToImport.forEach(function(file, i) {
            content += '@import "' + file + '";\n';
          });

          //fs.writeFile(options.source, content, 'utf8', function(err) {
            //callback(err);
          //});

          callback();

        });
      };

      var watchFiles = function(callback) {

        // TODO: Better rank of files
        getFiles(path.dirname(options.source), function(err, files) {
          if(err) return error(err);

          files.forEach(function(file, index) {
            var ext = path.extname(file);

            // Filter less files and dont use the source file
            if(ext === '.less') {

              filesToWatch.push(path.dirname(options.source) + file);
            }
          });

          callback();

        });
      };

    // Sort import files based on the rank set i the config.json file
    var sortFiles = function(files) {
        files.sort();
        rank = {
          "other": []
        };
        options.rank.forEach(function(type, i) {
          rank[type] = [];
        });

        files.forEach(function(file, i) {
          var isType = false;
          options.rank.forEach(function(type) {
            if(!isType) {
              var regexp = new RegExp('\\.' + type + '\\.less$', 'i');
              if(regexp.test(file)) {
                rank[type].push(file);
                isType = true;
              }
            }
          });

          if(!isType) {
            rank['other'].push(file);
          }
        });

        var sortedFiles = [];

        options.rank.forEach(function(type, i) {
          sortedFiles = sortedFiles.concat(rank[type]);
        });
        sortedFiles = sortedFiles.concat(rank['other']);

        return sortedFiles;

      };

    // Create less file with all vars set in config.json
    var createVarsFile = function(callback) {
        var filename = path.dirname(options.source) + "/global/global.var.less";

        mkdirp(path.dirname(filename), function(err) {
          if(err) return callback(err);

          // // Get sprite image size
          // if ('spriteImage' in options.vars) {

          //   // TODO: Just a hack
          //   var sprite = './public' + options.vars['spriteImage'].replace(/'/g, '');

          //   console.log(sprite);
          //   imagemagick.identify(sprite, function(err, features){
          //     if (err) return error(err);
          //     options.vars.spriteRetinaWidth = features.width;
          //     options.vars.spriteRetinaHeight = features.height;
          //   });
          // }

          var file = '';
          for(var variable in options.vars) {
            file += '@' + variable + ': ' + options.vars[variable] + ';\n';
          }

          // fs.writeFile(filename, file, 'utf8', function(err) {
          //   callback(err);
          // });

          callback();

        });
      };

    // Compile less to css for use in frontend
    var compile = function(callback) {

        getFile(options.source, function(err, lessStr) {
          if(err) return callback(err);

          // LESS parser
          var parser = new less.Parser({
            paths: [path.dirname(options.source)],
            filename: path.basename(options.source),
            optimization: options.optimization,
            dumpLineNumbers: options.dumpLineNumbers
          });

          parser.parse(lessStr, function(err, tree) {
            try {
              if(err) {
                lessError(err);
                return callback(err);
              }

              // Parse non-minified css
              var css = tree.toCSS({
                compress: false,
                yuicompress: false
              });
              var file = options.destination;

              // Parse minified css using yui compressor
              var cssMinified = tree.toCSS({
                compress: true,
                yuicompress: true
              });
              var dir = path.dirname(file);
              var ext = path.extname(file);
              var base = path.basename(file, ext);
              var fileMinified = dir + '/' + base + '.min' + ext;

              // Write both non- and minified files
              mkdirp(path.dirname(options.destination), function(err) {
                if(err) return callback(err);
                errors.less = {};

                var pending = 2;

                log('less', 'green', 'compiled', path.basename(file));
                fs.writeFile(file, css, 'utf8', function() {
                  if(!production) {
                    addCache(file, '/css/' + base + ext);
                  }
                  if(!--pending) {
                    callback();
                  }
                });

                log('less', 'green', 'compiled', path.basename(fileMinified));
                fs.writeFile(fileMinified, cssMinified, 'utf8', function() {
                  if(production) {
                    addCache(fileMinified, '/css/' + base + ext);
                  }
                  if(!--pending) {
                    callback();
                  }
                });
              });
            } catch(err) {
              lessError(err);
              callback(err);
            }
          });
        });
      };

    // Watch for changes on all less files and recompile on change
    var watch = function() {

        var last = new Date();

        log('less', 'yellow', 'watching', 'all import files');

        filesToWatch.forEach(function(file, index) {
          fs.watch(file, function(event, file) {
            var time = new Date();
            var diff = time - last;

            // Change event fires twice. Workaround that prevent two compilations => min 1 sec between compilations
            if(event === 'change' && diff > 1000) {
              last = time;
              compile(function() {});
            }
          });
        });
      };

    async.series([compile, watchFiles], function(err) {
      if(err) return error(err);

      // Don't watch file changes in production
      if(!production) {
        watch();
      }
    });

  };

// Compress images in assets folder using ImageOptim (http://imageoptim.com/)
var imageCompressor = function(options, production) {
    options.source = options.source || './assets/img';
    options.destination = options.destination || './public/img';

    var rawFiles = [];
    var smashedFiles = [];

    // Get path to all raw and compressed images
    var init = function() {
        var pending = 2;
        getFiles(options.source, function(err, files) {
          if(err) return error(err);
          files.forEach(function(file, index) {
            var ext = path.extname(file);
            if(ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
              rawFiles.push(file);
            }
          });
          if(!--pending) {
            start();
          }
        });
        getFiles(options.destination, function(err, files) {
          if(err) return error(err);
          smashedFiles = files;
          if(!--pending) {
            start();
          }
        });
      };

    var start = function() {
        rawFiles.forEach(function(file, index) {
          addCache(options.destination + stripFW(file), '/img' + stripFW(file), options.source + file);
        });
        if(!production) {
          watch();
          checkEdits();
        }
      };

    // Watch raw images and compress on change
    var watch = function() {

        var last = new Date();

        log('img', 'yellow', 'watching', 'raw files');
        async.forEach(rawFiles, function(file, callback) {
          fs.watch(options.source + '/' + file, function(event) {
            var time = new Date();
            var diff = time - last;
            if(event === 'change' && diff > 1000) {
              last = time;
              smash(file);
            }
          });
          callback();
        });
      };

    // On server start check if any images has changed
    var checkEdits = function() {
        async.forEach(rawFiles, function(file, callback) {
          fs.stat(options.source + file, function(err, stat) {
            if(err) return callback(err);
            if(stat.isFile()) {
              var rawMTime = stat.mtime;
              fs.stat(options.destination + stripFW(file), function(err, stat) {
                var smashFile = true;
                if(!err && stat.isFile() && stat.mtime >= rawMTime) {
                  smashFile = false;
                }
                if(smashFile) {
                  smash(file);
                }
                callback(err);
              });
            }
          });
        }, function(err) {
          error(err);
        });
      };

    // Remove fireworks .fw extension on raw png files
    var stripFW = function(file) {
        return file.replace('.fw', '');
      };

    // Compress raw jpg or png file using ImageOptim (imageoptim.com) and put it in the destination/public folder
    var smash = function(file) {
        var rawFile = options.source + file;
        var smashFile = options.destination + stripFW(file);

        fs.readFile(rawFile, function(err, data) {
          if(err) return error(err);
          mkdirp(path.dirname(smashFile), function(err) {
            if(err) return error(err);
            fs.writeFile(smashFile, data, function(err) {
              if(err) return error(err);

              // Send file to ImageOptim using command line
              exec('open -a ImageOptim.app ' + smashFile, function(err, stdout, stderr) {
                if(err) return error(err);
                if(stderr) return error(stderr);
                log('img', 'green', 'smashed', smashFile);
              });
            });
          });
        });

      };

    init();
  };

// Concat and compress javascript files: Turn folders with js files into one single compressed js file
var jsCompressor = function(options, production) {
    options.source = options.source ||  './assets/js';
    options.destination = options.destination || './public/js';
    // options.rank = options.rank || ['vendor', 'helper', 'plugin', 'class'];

    // Concat all files in folder with rank based on settings in config.json file
    var concat = function(module, files) {

        files.sort();

        var concattedFile = {
          'other': ''
        };
        options.rank.forEach(function(type) {
          concattedFile[type] = '';
        });

        var getFileTypes = function(i, done) {
          getFile(options.source + '/' + module + files[i], function(err, str) {
            if(err) return done(err);
            if(path.extname(files[i]) === '.js') {

              // Add comment to concatted file with referens to original file for easier debugging
              str = '/****** FILE: ' + module + files[i] + ' ******/' + '\n\n' + str + '\n\n\n\n';

              var isType = false;
              options.rank.forEach(function(type) {
                if(!isType) {
                  var regexp = new RegExp('\\.' + type + '\\.js$', 'i');
                  if(regexp.test(files[i])) {
                    concattedFile[type] += str;
                    isType = true;
                  }
                }
              });

              if(!isType) {
                concattedFile['other'] += str;
              }

            }
            i++;
            if (i < files.length) {
              getFileTypes(i,done);
            } else {
              done();
            }
          });
        };

        getFileTypes(0, function(err) {
          if(err) return error(err);

          var finalFile = '';
          options.rank.forEach(function(type) {
            finalFile += concattedFile[type];
          });
          finalFile += concattedFile['other'];
          writeFile(module, finalFile);
        });
      };

    // Get folders in source folder and filter out all starting with underscore (used for templates)
    var setModules = function(callback) {
        getFolders(options.source, function(err, folders) {
          if(err) return callback(err);
          var regexp = /^_/;
          folders.forEach(function(folder, index) {
            if(regexp.test(folder)) {
              folders.splice(index, 1);
            }
          });
          callback(null, folders);
        });
      };

    // Write concatted file to destination/public folder both as normal and minified (with .min extension)
    var writeFile = function(module, file) {

        var jsFile = options.destination + '/' + module + '.js';

        mkdirp(path.dirname(jsFile), function(err) {
          if(err) return error(err);

          fs.writeFile(jsFile, file, 'utf8', function(err) {
            if(err) return error(err);

            // Use non-minified version in development for better debugging
            if(!production) {
              addCache(jsFile, '/js/' + module + '.js');
            }
            log('js', 'green', 'concatted', path.basename(jsFile));
          });

          var minifiedFile = uglify.minify(file, {
            fromString: true
          }).code;
          var jsMinifiedFile = options.destination + '/' + module + '.min.js';
          fs.writeFile(jsMinifiedFile, minifiedFile, 'utf8', function(err) {
            if(err) return error(err);
            if(production) {
              addCache(jsMinifiedFile, '/js/' + module + '.js');
            }
            log('js', 'green', 'minified', path.basename(jsMinifiedFile));
          });
        });

      };

    // Watch all raw js and reconcat on changeß
    var watch = function(module, files) {

        var last = new Date();

        log('js', 'yellow', 'watching', 'files for ' + module + '.js');
        files.forEach(function(file, index) {
          if(path.extname(file) === '.js') {
            fs.watch(options.source + '/' + module + file, function(event, f) {
              var time = new Date();
              var diff = time - last;
              if(event === 'change' && diff > 1000) {
                last = time;
                concat(module, files);
              }
            });
          }
        });
      };

    function getManifests(callback) {
      var manifests = {};
      searchForFiles('_manifest.json', options.source, function(err, manifestFiles) {
        async.forEach(manifestFiles, function(manifestFile, index) {
          manifests[manifestFile] = [];
          fs.readFile(manifestFile, function(err, data) {
            manifests[manifestFile].push(JSON.parse(data));
          });
        }, function(err) {
          console.log(err);
          if (err) callback(err);
          console.log(manifests);
        });
      });

    }

    var init = function() {

        // setModules(function(err, modules) {
        //   if(err) return error(err);
        //   modules.forEach(function(module, index) {
        //     getFiles(options.source + '/' + module, function(err, files) {
        //       if(err) return error(err);
        //       concat(module, files);

        //       if(!production) {
        //         watch(module, files);
        //       }
        //     });
        //   });
        // });

        getManifests(function(manifests) {

        });

      };

    init();
  };

// Add md5 checksum to files for better use of far expire cache. Used with middleware
var addCache = function(source, url, raw) {
    var file = raw || source;

    fs.readFile(file, function(err, data) {
      if(err) return error(err);
      var hash = crypto.createHash('md5').update(data).digest('hex');

      cache.frontend[url] = '/' + hash + url;
      cache.backend['/' + hash + url] = source.replace('./public', '');
    });
  };

// Redirect md5 url'ed file to physical file
var middleware = function(req, res, next) {
    var url = req.url.split("?")[0].split("#")[0];
    redirect = cache.backend[url];
    if(redirect) {
      req.url = redirect;
    }
    next();
  };

module.exports = function(options, production) {
  options = options || {};
  if(production !== false) {
    production = true;
  }
  options.less = options.less || {};
  options.img = options.img || {};
  options.js = options.js || {};

  // LESS
  lessCompressor(options.less, production);

  // img
  imageCompressor(options.img, production);

  // js
  jsCompressor(options.js, production);

  return {
    'cache': cache,
    'errors': errors,
    'middleware': function() {
      return middleware;
    }
  };

};