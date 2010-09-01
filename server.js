/**

  Memetec

  Memetec is a software platform for the creative reuse of media.

  Visit http://mem.ec/ and sign up to begin creating.

  This software is based on the work of Michael Dale's html5 video editor 
  built by Kaltura in collaboration with Wikimedia for use in the Wikipedia.
  For video hosting, the sytem uses a Kaltura Server.  For more information
  plese visit http://html5video.org/ and http://kaltura.org/

  © Copyright 2010
  The Memetec Federation, Light Corporation, Inc., and Andrew Davis

  Stop by #memetec on freenode.net irc to discuss this project.

**/


/**
  Setup Dependencies
**/

require.paths.unshift('./npm')
var sys = require('sys'),
    fs = require('fs'),
    oauth = require('oauth'),
    connect = require('connect'),
    express = require('express'),
    jade = require('jade');


/**
  Are we in a Development or Production environment

  If you're running this on your own computer, 
  copy development-settings.json.sample to development-settings.json 
  and modify.

  Heroku: make sure you have the following environment variables included 
  in your production environment, the handy heroku config command to do this is:

      heroku config:add REDIS_HOST=something.redistogo.com REDIS_PORT=9379 REDIS_PASS=something

  * Make sure you don't set the PORT variable, heroku takes care of that for you.
  http://docs.heroku.com/config-vars
**/

var settings = {};

if (process.env.PORT) {

    redis_url = require('url').parse(process.env.REDISTOGO_URL);

    settings.environment = "Production";
    settings.host = "mem.ec";
    settings.base = "http://mem.ec/";
    settings.port = process.env.PORT;
    settings.redis_host = redis_url.hostname;
    settings.redis_pass = redis_url.auth.split(':')[1];
    settings.redis_port = redis_url.host.split(redis_url.hostname)[1].replace(':', '');
    settings.twitter_key = process.env.TWITTER_KEY;
    settings.twitter_secret = process.env.TWITTER_SECRET;
    }
else {
    settings = JSON.parse( fs.readFileSync('development-settings.json', encoding='utf8') );
  }


/**
  Setup the Redis connection for user/session management
**/

var RedisCredentials = {
    host: settings.redis_host,
    pass: settings.redis_pass,
    port: parseInt(settings.redis_port)
    };

var redis = require('redis-client').createClient(RedisCredentials.port, RedisCredentials.host);


/**
  We're using twitter for authentication
**/

var Twitter = new oauth.OAuth(
    'http://api.twitter.com/oauth/request_token',
    'http://api.twitter.com/oauth/access_token',
    settings.twitter_key,
    settings.twitter_secret,
    '1.0',
    null,
    'HMAC-SHA1'
    );
if (RedisCredentials.pass) {
    redis.auth(RedisCredentials.pass);
    }


/**
  Setup the Express Application
**/

var app = express.createServer(connect.cookieDecoder(), connect.session());
app.set('view engine', 'jade');
app.configure(function(){
    app.use(express.staticProvider(__dirname + '/public'));
    });


/**
  Express Routing
  /:meme    --> loads up that meme
  /         --> the home page if a session has been established
  /login    --> start Twitter oauth
  /callback --> register a session
**/

app.get('/login', function(req, res) {
    return Twitter.getOAuthRequestToken(function(error, token, secret, url, params) {
      req.session['token'] = token;
      req.session['secret'] = secret;
      //sys.puts(("Request Token: " + (token)));
      //sys.puts(("Request Secret: " + (secret)));
      return res.redirect(("http://api.twitter.com/oauth/authenticate?oauth_token=" + (token)));
      });
    });

app.get('/callback', function(req, res) {
    return Twitter.getOAuthAccessToken(
      req.session['token'], 
      req.session['secret'], 
      function(error, access_token, access_secret, params) {
        sys.puts(("Access Token: " + (access_token)));
        sys.puts(("Access Secret: " + (access_secret)));
        sys.puts(("Params: " + (JSON.stringify(params))));
        req.session['access_token'] = access_token;
        req.session['access_secret'] = access_secret;
        return res.redirect('/');
        }
      );
    });


app.get('/:meme', function(req, res){
    if (req.params.meme) {
      res.render('meme', {
        locals: {
          meme: req.params.meme,
          host: settings.host,
          base: settings.base,
          title: req.params.meme + '  [ ' + settings.host + ' ]'
          }
        });
      }
    else {
      // render the home page if params are not defined.
      next();
      }
    });


app.get('/', function(req, res){
    if (req.session['access_token']) {
      sys.puts(JSON.stringify(req.session));
      return Twitter.getProtectedResource(
        'http://api.twitter.com/1/account/verify_credentials.json',
        'GET',
        req.session['access_token'],
        req.session['access_secret'],
        function(error, data, response) {
          res.render('home', {
            locals: {
              host: settings.host,
              base: settings.base,
              title: '[ ' + settings.host + ' ]'
              }
            });
          }
        );
      } 
    else {
      return res.render('login', {
            locals: {
              host: settings.host,
              base: settings.base,
              title: '[ ' + settings.host + ' ]'
              }
            });
      }
    });


/**
  Express Application Helpers
**/

app.dynamicHelpers({
     session: function(req, res){
       return req.session;
       }
     });

/**
  Let's go!
**/

app.listen(parseInt( settings.port ), null);
sys.puts(settings.environment + " server running at http://" + settings.host + ":" + settings.port + "/");
