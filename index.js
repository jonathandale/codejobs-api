require('dotenv').load();

var express = require('express'),
    request = require('request'),
    parser = require('xml2json'),
    app = express(),
    server;

//Configure middleware
app.use(function (req, res, next) {
  if(process.env.dev === 'true') {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  }
  next();
})

//Search routes
app.get('/jobsearch/github', function(req, res) {
  request({url: 'https://jobs.github.com/positions.json',
           json: true,
           qs: req.query}, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      res.send(body);
    }
  })
});

//Start server
server = app.listen(3000, function() {
  var host = server.address().address,
      port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
