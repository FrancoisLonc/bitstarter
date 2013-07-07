var express = require('express');

var filesystem_lib = require('fs');

var app = express.createServer(express.logger());

app.get('/', function(request, response) {
  var filecontent = filesystem_lib.readFileSync("index.html", 'utf8');
  response.send(filecontent);
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

