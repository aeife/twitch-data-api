var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router();
router.get('/', function(req, res) {
    res.json({ message: 'working' });
});

var mongoose = require('mongoose');
var dbConnection = mongoose.connect('mongodb://localhost:27017/twitchdata');

var gameApi = require('./app/api/games.js');
var statsApi = require('./app/api/stats.js');
var channelsApi = require('./app/api/channels.js');
app.use('/api/v1', router);
app.use('/api/v1', gameApi);
app.use('/api/v1', statsApi);
app.use('/api/v1', channelsApi);

var port = process.env.PORT || 8080;
app.listen(port);
console.log('Server started on port ' + port);
