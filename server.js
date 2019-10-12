var express = require('express');
var app = express();
var path = require('path');

// viewed at http://localhost:8080

app.use('/js', express.static(path.join(__dirname, 'js')))

app.get('/', function(req, res) {
    console.log("get");
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(8080);