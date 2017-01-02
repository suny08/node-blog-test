var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var router= require('./routes/router');
var setting=require('./setting');
var session=require('express-session');
var mongoStore=require('connect-mongo')(session);
var flash=require('connect-flash');
var fs=require('fs');
var accessLog=fs.createWriteStream('access_log',{flags:'a'});
var errorLog=fs.createWriteStream('error_log',{flags:'a'});
var app = express();
app.use(session({
  secret:setting.cookieSecret,
  key:setting.db,
  cookie:{maxAge:1000*60*60*24*30},
  store:new mongoStore({
    db:setting.db,
    host:setting.host,
    port:setting.port,
    url:"mongodb://localhost:27017"
  })
}));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(flash());
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(logger({stream:accessLog}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(err,req,res,next){
  var meta='['+new Date()+'] '+req.url+'\n';
  errorLog.write(meta+err.stack+'\n');
});
router(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
