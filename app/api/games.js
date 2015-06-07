var express = require('express');
var Game = require('../models/game').model;
var router = express.Router();
var _ = require('lodash');

var queryGames = function (options) {
  var group = {
    _id: "$_id",
    name: { $first: "$name" },
    viewers: {},
    channels: {}
  };
  group.viewers['$' + options.sortType] = "$stats.viewers";
  group.channels['$' + options.sortType] = "$stats.channels";

  if (options.fullData) {
    group.stats = {
      $push: {
        viewers: "$stats.viewers",
        channels: "$stats.channels"
      }
    };
  }

  var sort = {};
  if (options.order == 'asc') {
    sort[options.sortAttr] = 1;
  } else {
    sort[options.sortAttr] = -1;
  }

  var search = {};
  if (options.search) {
    search.name = {$regex: options.search, $options: 'i'};
  }

  return Game
  .aggregate()
  .match(search)
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
      sortType: 'last',
      search: null
    });

    queryGames(options)
    .exec(function(err, games) {
      if (err) {
        res.send(err);
      }

      res.json({
        games: _.slice(games, options.offset || 0).slice(0, options.limit),
        limit: req.query.limit,
        offset: req.query.offset,
        count: games.length
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
