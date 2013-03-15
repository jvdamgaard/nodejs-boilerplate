var fsExt = require('./fs-ext'),
    exec  = require('child_process').exec;

module.exports = function(options, cache, production, callback) {
  options.source      = options.source || './assets/img/sprite';
  options.destination = options.destination || './public/img/sprite.png';

  var generete = function(files, callback) {

    // var imArgs = files;
    // imArgs.push('-background');
    // imArgs.push('transparent');
    // imArgs.push('-gravity');
    // imArgs.push('center');
    // // imArgs.push('-border');
    // // imArgs.push('x1-y');
    // // imArgs.push('-bordercolor');
    // // imArgs.push('transparent');
    // imArgs.push('-append');
    // imArgs.push(options.destination);

    // im.convert(imArgs, function(err, stdout) {
    //   if (err) return callback(err);
    // });

   //  var commands = [
   //    'montage -alpha on',
   //    '-background none',
   //    '-mode concatenate',
   //    '-tile x1',
   //    '-frame 1',
   //    '-mattecolor none']
   // *.jpg            \
   // output1.png

   //  exec('open -a ImageOptim.app ' + smashFile, function(err, stdout, stderr) {
   //    if(err) return error(err);
   //    if(stderr) return error(stderr);
   //    log('img', 'green', 'smashed', smashFile);
   //  });

  };


  var init = function(callback) {
    fsExt.getFilesFromPath(options.source, function(err, files) {
      if (err) return callback(err);
      generete(files, callback);
    });
  };

  return {
    generate: function(callback) {
      init(callback);
    }
  };
};