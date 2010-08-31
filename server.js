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
    express = require('express'),
    oauth = require('oauth').OAuth
    haml = require('hamljs');


/**
  Are we in Development or Production Mode
/**

// TODO: Setup different environments for development and production.


/**
  Setup the Redis connection for user/session management

var RedisCredentials = {
    host: process.env.REDIS_HOST,
    pass: process.env.REDIS_PASS,
    port: parseInt(process.env.REDIS_PORT)
    };

var redis = require('redis').createClient(RedisCredentials.port, RedisCredentials.host);
**/

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
  /:meme  --> loads up that meme
  /       --> the home page
**/

app.get('/:meme', function(req, res){
    if (req.params.meme) {
      res.render('meme', {
        locals: { meme: req.params.meme }
        });
      }
    else {
      // render the home page if params are not defined.
      next();
      }
    });

app.get('/', function(req, res){
    res.render('home');
    });


/**
  Let's go!
**/

app.listen(parseInt(process.env.PORT || 3000), null);
sys.puts("Server running at http://localhost:3000/");
