require('dotenv').load();

var express = require('express'),
    request = require('request'),
    parseString = require('xml2js').parseString,
    moment = require('moment'),
    Entities = require('html-entities').AllHtmlEntities,
    entities = new Entities(),
    app = express(),
    server;

//Configure middleware
app.use(express.static('public'));
app.use(function (req, res, next) {
  var origin = (process.env.dev === 'true') ? "*" : "codejobs.surge.sh";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//Search routes
app.get('/search/github', function(req, res) {
  var shaped = [],
      now = moment();
  request({url: 'https://jobs.github.com/positions.json',
           json: true,
           qs: req.query}, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      if(body.length) {
        body.forEach(function(item, idx){
          var created = moment(Date.parse(item['created_at'])),
              date = created.isAfter(now) ? now : created;
          shaped.push({
            title: item.title,
            url: item.url,
            relative_date: date.fromNow(),
            date: date.format('Do MMMM, YYYY'),
            timestamp: date.unix(),
            location: item.location,
            description: item.description,
            company: item.company,
            apply: item.how_to_apply,
            provider: 'github',
          });
        });
      }
      res.send(shaped);
    }
  })
});


//SO Helpers

function cleanJobTitle(company, location, title){
  return entities.decode(title.replace(/&#40;/g, '(')
                              .replace(/&#41;/g, ')')
                              .replace('at ' + company, '')
                              .replace('(' + location + ')', '')
                              .replace('(allows remote)', '').trim());
}

app.get('/search/stackoverflow', function(req, res){
  var shaped = [],
      items = [],
      parsed, xml;
  request({url: 'http://careers.stackoverflow.com/jobs/feed',
           json: true,
           qs: req.query}, function(error, response, body){
    if (!error && response.statusCode == 200) {
      parseString(body, {explicitArray: false}, function(err, result){
        items = result.rss.channel.item;
        if(items.length) {
          items.forEach(function(item, idx){
            var date = moment(item['a10:updated'])
                company = item['a10:author']['a10:name'],
                location = (item.location) ? item.location['$t'] : null;
            shaped.push({
              title: cleanJobTitle(company, location, item.title),
              url: item.link,
              relative_date: date.fromNow(),
              date: date.format('Do MMMM, YYYY'),
              timestamp: date.unix(),
              location: location,
              description: entities.decode(item.description),
              company: entities.decode(company),
              provider: 'stackoverflow',
            });
          });
        }
        res.send(shaped);
      });
    }
  })
});


//Start server
server = app.listen(3003, function() {
  var host = server.address().address,
      port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
});
