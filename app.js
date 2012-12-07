/*
 * Import modules
 */

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    uglifyjs = require('uglify-js'),
    assetmanager = require('connect-assetmanager');

var app = express();

/*
 * Connect-assetmanager settings
 *    JS:
 *      - Concat files make them available at js/head.js and js/foot.js
 *      - Minify with UglifyJS
 *      - Cache with unique hash
 *    LESS:
 *      - Parse from main less file (e.g. main.less in /assets/less)
 *      - Minify with YUICompressor
 *      - Make available at css/style.css
 *      - Cache with unique hash
 */

// Use UglifyJS2 for smallest posible js files
var assetUglify = function(file, path, index, isLast, callback) {
  var result = uglifyjs.minify(file, {fromString: true});
  callback(result.code);
};

var assetOptions = {
  js : {
    path: __dirname + '/assets/js/',
    files: {
      head: ['*'],
      foot: [/\.vendor\.js$/i,/\.plugin\.js$/i,/\.module\.js$/i]
    },
    stale: true,
    postManipulate: {
      '^': [assetUglify]
    },
    debug: false
  },
  less: {
    src: __dirname + '/assets/less',
    dest: __dirname + '/public/css',
    prefix: '/css',
    yuicompress: true,
    optimization: 2,
    debug: false,
    dumpLineNumbers: false,
    once: true
  }
};

// Special for development environment
app.configure('development', function(){

  assetOptions.js.stale = false;
  assetOptions.js.postManipulate = {};
  assetOptions.js.debug = true;
  assetOptions.js.files.foot.push(/\.development\.js$/i);

  assetOptions.less.yuicompress = false;
  assetOptions.less.debug = true;
  assetOptions.less.once = false;
});

// Create the asset groups
var assetManagerGroups = {};

// Javascript
['head','foot'].forEach(function(type) {
  assetManagerGroups['js-'+type] = {
    'path': assetOptions.js.path+type+'/',
    'files': assetOptions.js.files[type],
    'route': new RegExp('js/'+type+'.js'),
    'dataType': 'javascript',
    'stale': assetOptions.js.stale,
    'postManipulate': assetOptions.js.postManipulate,
    'debug': assetOptions.js.debug
  };
});

app.configure(function(){
  app.set('port', process.env.PORT || 8080);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');

  // Vars in ejs
  /*app.use(function(req, res, next){
    res.locals({
      cachehash: assetmanager
    });
    next();
  });*/
  app.use(express.compress());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  //app.use(require('./lib/h5bp')()); // TODO: is not working that good
  app.use(assetmanager(assetManagerGroups));
  app.use(require('less-middleware')(assetOptions.less));

  app.use(express.static(path.join(__dirname, 'public')));

});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
