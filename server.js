/**

  memetec.tv

  memetec.tv is a software platform for the creative reuse of media.

  Visit http://mem.ec/ and sign up to begin creating.

  This software is based on the work of Michael Dale's html5 video editor 
  built by Kaltura in collaboration with Wikimedia for use in the Wikipedia.
  For video hosting, the sytem uses a Kaltura Server.  For more information
  plese visit http://html5video.org/ and http://kaltura.org/

  Stop by #memetec on freenode.net irc to discuss this project.

  memetec.tv - collaborative & emergent video editing in the cloud
  Copyright (C) 2010  Andrew Davis

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.

 */


/**
  * Setup Dependencies
 */

require.paths.unshift('./npm')
var sys = require('sys'),
    oauth = require('oauth'),
    connect = require('connect'),
    redis_store = require('connect-redis'),
    mongoose = require('mongoose').Mongoose,
    express = require('express'),
    jade = require('jade');


/**
  * Are we in a Development or Production Environment?

    If you're running this on your own computer, 
    copy development-settings.json.sample to development-settings.json 
    and modify.

    By default, this application assumes heroku to be the production environment,
    and it falls back to development mode.

    To execute a development environment, copy development-settings.json.sample
    to development-settings.json and then run 

        $ node run_dev_server.js

    Should you wish to run this in application another environment, just set a PORT 
    environment variable, and all other variables will be read from the server's 
    environment variables as well

    You will need to add all variables listed in the development-settings file for 
    your server's environment.  On Heroku, you do that with the `heroku config` command.

        heroku config:add VARIABLE=something.redistogo.com ANOTHER_VARIABLE=12345657879

    * Make sure you don't set the PORT variable on heroku, heroku takes care of that for you.
    http://docs.heroku.com/config-vars
 */

var settings = {};

if (process.env.PORT) { // we're in production

    redis_url = require('url').parse(process.env.REDISTOGO_URL);

    settings.environment = "Production";
    settings.host = "mem.ec";
    settings.base = "http://mem.ec/";
    settings.port = process.env.PORT;
    settings.mongo_url = process.env.MONGOHQ_URL;
    settings.redis_host = redis_url.hostname;
    settings.redis_pass = redis_url.auth.split(':')[1];
    settings.redis_port = parseInt(redis_url.host.split(redis_url.hostname)[1].replace(':', ''));
    settings.twitter_key = process.env.TWITTER_KEY;
    settings.twitter_secret = process.env.TWITTER_SECRET;
    }
else {                  // we're in development

    settings = JSON.parse( require('fs').readFileSync('development-settings.json', encoding='utf8') );
  }

/**
  * Setup A MongoDB for Meme storage
 */

 mongoose.model('Meme', {

  collection: 'memes', 

  /* properties: ['title', { 
                version: [
                  'user', 
                  'timestamp', 
                  'smil', 
                  'score'] } ], */

  properties: ['title', {version: ['user', 'timestamp', 'smil', 'score']}],

  cast: {
    title: String,
    version: {
      user: String,
      timestamp: String,
      smil: String,
      score: String,
      },
    mostPopular: String, //should be an index of a //meme/user/timestamp
    },

  indexes: [
    [['title'],['version.user'],['version.timestamp']], //meme/user/timestamp
    [['version.user'],['version.timestamp']],           //meme/user/most-recent
    [['title'],['version.score']],                      //meme-most-popular
    ],

  setters: {
    title: function(v){
      this = this.v.capitalize();                // CamelCase the Title
      return this.replace(" ","");
      }
    },
  }
); // end of mongoose.model.meme

/**
  * Setup a connection to the database server 
 */

var db = mongoose.connect(settings.mongo_url); //,
//        Memes = mongoose.noSchema('memes',db);



//db.meme.save({title: ':)', user:'papyromancer', smil: '<XML>'});

/**
  * Setup the Redis connection for user/session management
 */

var session_store = new redis_store({ 
        maxAge: 60000 * 60 * 24 * 28,
        reapInterval: 60000 *60 * 24 * 7,
        host: settings.redis_host,
        port: settings.redis_port,
        }) 

var redisAuth = function() { session_store.client.auth( settings.redis_pass ); sys.puts('connected to redis'); }
session_store.client.addListener('connected', redisAuth);
session_store.client.addListener('reconnected', redisAuth);
redisAuth();



/**
  * We're using twitter for authentication
 */

var Twitter = new oauth.OAuth(
    'http://api.twitter.com/oauth/request_token',
    'http://api.twitter.com/oauth/access_token',
    settings.twitter_key,
    settings.twitter_secret,
    '1.0',
    null,
    'HMAC-SHA1'
    );


/**
  * Setup the Express Application
 */

var app = express.createServer(
    connect.cookieDecoder(), 
    connect.session({ 
      store: session_store      })
    );
app.set('view engine', 'jade');
app.configure(function(){
    app.use(express.staticProvider(__dirname + '/public'));
    });


/**
  * Express Routing
    /:meme    --> loads up that meme
    /         --> the home page if a session has been established
    /login    --> start Twitter oauth
    /callback --> register a session
 */

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
  * Express Application Helpers
 */

app.dynamicHelpers({
     session: function(req, res){
       return req.session;
       }
     });

/**
  * Let's go!
 */

app.listen(parseInt( settings.port ), null);
sys.puts('node.js version: ' + process.version);
sys.puts(settings.environment + " server running at http://" + settings.host + ":" + settings.port + "/");
sys.puts(sys.inspect(settings));
