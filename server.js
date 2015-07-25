var express = require('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

var router = express.Router();
router.get('/', function(req, res) {
    res.json({ message: 'working' });
});

var mongoose = require('mongoose');
var dbConnection = mongoose.connect('mongodb://localhost:27017/twitchdata');

var gameApi = require('./app/api/games.js');
var statsApi = require('./app/api/stats.js');
app.use('/api/v1', router);
app.use('/api/v1', gameApi);
app.use('/api/v1', statsApi);

var port = process.env.PORT || 8080;
app.listen(port);
console.log('Server started on port ' + port);
