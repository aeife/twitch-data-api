var express = require('express');
var Game = require('../models/game').model;
var mongoose = require('mongoose');
var LastRun = mongoose.model('Game', require('../models/game').schema, 'lastRun');
var CollectionRun = require('../models/collectionRun').model;
var router = express.Router();
var _ = require('lodash');
var async = require('async');


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
      search: null
    });

    var sort = {};
    sort[options.sortAttr] = options.order === 'desc' ? -1 : 1;

    var search= {};
    if (options.search) {
      search.name = {$regex: options.search, $options: 'i'};
    }

    var requests = [];

    requests.push(function (cb) {
      LastRun
        .find(search)
        .count()
        .exec(cb);
    });

    requests.push(function (cb) {
      LastRun
        .find(search)
        .limit(options.limit)
        .skip(options.offset)
        .sort(sort)
        .exec(cb);
    });

    async.parallel(requests, function (err, result) {
      res.json({
        games: result[1],
        limit: options.limit,
        offset: options.offset,
        count: result[0]
      });
    });


  });

router.route('/games/:gameName')
  .get(function(req, res) {
    if (!req.params.gameName || !req.params.gameName.length) {
      return res.sendStatus(404);
    }

    var requests = [];

    requests.push(function (cb) {
      CollectionRun.findOne({}).sort({_id: -1}).exec(cb);
    });

    requests.push(function (cb) {
      Game.findOne({name: req.params.gameName}).populate('stats.collectionRun').exec(cb);
    });

    async.parallel(requests, function (err, result) {
      if (!result[1]) {
        return res.sendStatus(404);
      }

      res.json({
        game: result[1],
        lastCollectionRun: result[0]
      });
    });
  });

module.exports = router;
