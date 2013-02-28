/*
 * Import modules
 */

var express     = require('express'),
    http        = require('http'),
    path        = require('path'),
    engine      = require('ejs-locals'),
    // h5bp        = require('./lib/h5bp'),
    h5bp        = require('h5bp'),
    routes      = require('./routes'),
    config      = require('./config');

var app = express();

config.production = true;

// Special for development environment
app.configure('development', function() {
  config.production = false;
});

var assetManager = require('./lib/assetmanager')(config.assets, config.production);

app.configure(function() {

  app.set('port', process.env.PORT || 8080);
  app.set('views', __dirname + '/views');
  app.engine('ejs', engine);
  app.set('view engine', 'ejs');

  // Vars in ejs
  app.use(function(req, res, next) {
    res.locals({
      cache: assetManager.cache.frontend,
      errors: assetManager.errors,
      production: config.production
    });
    next();
  });

  app.use(assetManager.middleware());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(h5bp({
    root: path.join(__dirname, 'public'),
    www: false,
    cors: true
  }));
  app.use(express.compress());
  app.use(express.static(path.join(__dirname, 'public')));

});

app.configure('development', function() {
  app.use(express.errorHandler());
});

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});