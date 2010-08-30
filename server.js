require.paths.unshift('./vendor')
vrequire = function(lib) { 
    require.paths.unshift("vendor/.npm/" + lib + "/active/package/lib");
    return require(lib); 
}
var app = vrequire('express').createServer();
app.get('/', function(req, res){
    res.send('Hello World');
    });
app.listen(3000);
var sys = require('sys');
sys.puts("Server running at http://localhost:3000/");
