require.paths.unshift('./npm')

var app = require('express').createServer();

app.get('/', function(req, res){
    res.send('Hello World');
    });

//app.listen(3000);
app.listen(parseInt(process.env.PORT || 8000), null)


var sys = require('sys');
sys.puts("Server running at http://localhost:8000/");
