var express = require('express');
var Game = require('../models/game').model;
var Stats = require('../models/stats').model;
var router = express.Router();
var _ = require('lodash');

router.route('/stats')
  .get(function(req, res) {
    Stats
      .find()
      .exec(function (err, stats) {
        res.json({
          stats: stats
        });
      });
  });

module.exports = router;
