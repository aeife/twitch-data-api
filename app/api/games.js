var express = require('express');
var Game = require('../models/game').model;
var CollectionRun = require('../models/collectionRun').model;
var router = express.Router();
var _ = require('lodash');

var aggregateGroup = function (options) {
  var group = {
    _id: "$_id",
    name: { $first: "$name" }
  };

  if (options.sortType === 'avg') {
    group.viewersSum = {$sum: "$stats.viewers"};
    group.firstCollectionRun = {$first: "$stats.collectionRun"};
    group.channelsSum = {$sum: "$stats.channels"};
  } else {
    group.channels = {$last: "$stats.channels"};
    group.viewers = {$last: "$stats.viewers"};
  }

  if (options.fullData) {
    group.stats = {
      $push: {
        viewers: "$stats.viewers",
        channels: "$stats.channels",
        collectionRun: "$stats.collectionRun"
      }
    };
  }
  return group;
};

var aggregateSearch = function (options) {
  var search = {};
  if (options.search) {
    search.name = {$regex: options.search, $options: 'i'};
  }
  return search;
};

var aggregateProject = function (options) {
  var project = {
    _id: "$_id",
    name: "$name",
    stats: "$stats",
  };

  if (options.sortType === "avg") {
    project.viewers = { $divide: [
      '$viewersSum', {$subtract: [options.lastRun, {$subtract: ["$firstCollectionRun", 1]}]}
    ]};
    project.channels = { $divide: [
      '$channelsSum', {$subtract: [options.lastRun, {$subtract: ["$firstCollectionRun", 1]}]}
    ]};
  } else {
    project.viewers = "$viewers";
    project.channels = "$channels";
  }

  return project;
};

var aggregateGames = function (options) {
  return Game
  .aggregate()
  .match(aggregateSearch(options))
  .unwind("stats")
  .group(aggregateGroup(options))
  .project(aggregateProject(options));
};

var queryGames = function (options, callback) {
  if (options.sortType === 'avg') {
    CollectionRun.findOne().sort({_id: -1}).limit(1).exec(function (err, lastRun) {
      options.lastRun = lastRun._id;
      callback(err, aggregateGames(options));
    });
  } else {
    callback(null, aggregateGames(options));
  }
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

    queryGames(options, function (err, aggregatedResult) {
      aggregatedResult
        .exec(function(err, games) {
          if (err) {
            res.send(err);
          }

          Game.populate(games, {path: 'stats.collectionRun'}, function (error, games) {
            if (err) {
              res.send(err);
            }

            games.sort(function (d1, d2) {
              if (options.order === 'desc' && options.sortAttr === 'ratio') {
                return ((d2.channels > 0) ? d2.viewers / d2.channels : 0) - ((d1.channels > 0) ? d1.viewers / d1.channels : 0);
              } else if (options.sortAttr === 'ratio') {
                return ((d1.channels > 0) ? d1.viewers / d1.channels : 0) - ((d2.channels > 0) ? d2.viewers / d2.channels : 0);
              } else if (options.order === 'desc') {
                if(d1[options.sortAttr] < d2[options.sortAttr]) return 1;
                if(d1[options.sortAttr] > d2[options.sortAttr]) return -1;
                return 0;
              } else {
                if(d1[options.sortAttr] < d2[options.sortAttr]) return -1;
                if(d1[options.sortAttr] > d2[options.sortAttr]) return 1;
                return 0;
              }
            });

            res.json({
              games: _.slice(games, options.offset || 0).slice(0, options.limit),
              limit: req.query.limit,
              offset: req.query.offset,
              count: games.length
            });
          });
        });
    });
  });

router.route('/games/:gameId')
  .get(function(req, res) {
    if (!req.params.gameId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.sendStatus(404);
    }

    Game.findById(req.params.gameId).populate('stats.collectionRun').exec(function (err, game) {
      if (!game) {
        return res.sendStatus(404);
      }

      res.json(game);
    });
  });

module.exports = router;
