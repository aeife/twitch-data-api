var express = require('express');
var Game = require('../models/game').model;
var router = express.Router();
var _ = require('lodash');

var queryGames = function (attr, sortType, fullData, order) {
  var group = {
    _id: "$_id",
    name: { $first: "$name" },
    viewers: {},
    channels: {}
  };
  group.viewers['$' + sortType] = "$stats.viewers";
  group.channels['$' + sortType] = "$stats.channels";

  if (fullData) {
    group.stats = {
      $push: {
        viewers: "$stats.viewers",
        channels: "$stats.channels"
      }
    };
  }

  var sort = {};
  if (order == 'asc') {
    sort[attr] = 1;
  } else {
    sort[attr] = -1;
  }

  return Game
  .aggregate()
  .unwind("stats")
  .group(group)
  .sort(sort);
};

router.route('/games')
  .get(function(req, res) {
    var options = req.query;
    _.defaults(options, {
      limit: 50,
      offset: 0,
      fullData: false,
      order: 'desc',
      sortAttr: 'viewers',
      sortType: 'last'
    });

    queryGames(options.sortAttr, options.sortType, options.fullData, options.order)
    .limit(parseInt(options.limit))
    .skip(parseInt(options.offset || 0))
    .exec(function(err, games) {
      if (err) {
        res.send(err);
      }

      Game.count(function (err, count) {
        if (err) {
          res.send(err);
        }

        res.json({
          games: games,
          limit: req.query.limit,
          offset: req.query.offset,
          count: count
        });
      });
    });
  });

router.route('/games/:gameId')
  .get(function(req, res) {
    if (!req.params.gameId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.sendStatus(404);
    }

    Game.findById(req.params.gameId, function (err, game) {
      if (!game) {
        return res.sendStatus(404);
      }

      res.json(game);
    });
  });

module.exports = router;
