require.paths.unshift('./vendor')

var app = require('express').createServer();
app.get('/', function(req, res){
        res.send('Hello World');
        });
app.listen(3000);
var sys = require('sys');
sys.puts("Server running at http://localhost:3000/");
