require('dotenv').load();

var express = require('express'),
    request = require('request'),
    parser = require('xml2json'),
    moment = require('moment'),
    app = express(),
    server;

//Configure middleware
app.use(function (req, res, next) {
  if(process.env.dev === 'true') {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  }
  next();
});

//Search routes
app.get('/search/github', function(req, res) {
  var shaped = [];
  request({url: 'https://jobs.github.com/positions.json',
           json: true,
           qs: req.query}, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      body.forEach(function(item){
        var date = moment(item['created_at']);
        shaped.push({
          title: item.title,
          url: item.url,
          date: date.format(),
          location: item.location,
          description: item.description,
          company: item.company
        });
      });
      res.send(shaped);
    }
  })
});


//SO Helpers

function cleanJobTitle(company, location, title){
  return title.replace(/&#40;/g, '(')
              .replace(/&#41;/g, ')')
              .replace('at ' + company, '')
              .replace('(' + location + ')', '')
              .replace('(allows remote)', '').trim();
}

app.get('/search/stackoverflow', function(req, res){
  var shaped = [],
      xml;
  request({url: 'http://careers.stackoverflow.com/jobs/feed',
           json: true,
           qs: req.query}, function(error, response, body){
    if (!error && response.statusCode == 200) {
      xml = parser.toJson(body, {object: true});
      xml.rss.channel.item.forEach(function(item){
        var date = moment(item['a10:updated'])
            company = item['a10:author']['a10:name'],
            location = item.location['$t'];
        shaped.push({
          title: cleanJobTitle(company, location, item.title),
          url: item.link,
          date: date.format(),
          location: location,
          description: item.description,
          company: company
        });
      });
      res.send(shaped);
    }
  })
});


//Start server
server = app.listen(3003, function() {
  var host = server.address().address,
      port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
