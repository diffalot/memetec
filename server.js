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
    express = require('express'),
    oauth = require('oauth'),
    haml = require('hamljs');


/**
  Are we in Development or Production Modea
**/

var settings = undefined;

if (process.env.PORT) {
  settings.environment = "Production";
  settings.port = process.env.PORT;
  settings.redis_host = process.env.REDIS_HOST;
  settings.redis_pass = process.env.REDIS_PASS;
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

var app = express.createServer();
app.set('view engine', 'haml');
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

app.get('/:meme', function(req, res){
    if (req.params.meme) {
      res.render('meme', {
        locals: {
          meme: req.params.meme
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
          return res.render('home', {
            locals: {
              user: JSON.parse(data),
              anon: false
              }
            });
          }
        );
      } 
    else {
      return res.render('home', {
        locals: {
          user: "anonymous",
          anon: true
          }
        });
      }
    });


/**
  Let's go!
**/

app.listen(parseInt( settings.port ), null);
sys.puts(settings.environment + " server running at http://localhost:" + settings.port + "/");
