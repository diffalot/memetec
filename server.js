require.paths.unshift('./npm')

var sys = require('sys'),
    haml = require('hamljs');

var app = require('express').createServer();

app.set('view engine', 'haml');

app.configure(function(){
    app.use(require('express').staticProvider(__dirname + '/public'));
    });

app.get('/', function(req, res){
    res.render('default');
    });

// Start listening on heroku port or localhost:3000 if we're running locally
app.listen(parseInt(process.env.PORT || 3000), null);

// Log that we're up and running
sys.puts("Server running at http://localhost:3000/");
