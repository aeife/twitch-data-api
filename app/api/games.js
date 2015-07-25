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

    Game.findOne({name: req.params.gameName}, {stats: 0, __v: 0}).exec(function (err, result) {
      if (!result) {
        return res.sendStatus(404);
      }

      res.json(result);
    });
  });

router.route('/games/:gameName/stats')
  .get(function(req, res) {
    if (!req.params.gameName || !req.params.gameName.length) {
      return res.sendStatus(404);
    }

    var requests = [];

    requests.push(function (cb) {
      CollectionRun.findOne({}).sort({_id: -1}).exec(cb);
    });

    requests.push(function (lastCollectionRun, cb) {
      var currentDate = new Date(lastCollectionRun.date);
      var lastMonth = new Date(currentDate.getTime());
      lastMonth = lastMonth.setMonth(lastMonth.getMonth() - 1);
      var lastQuarter = new Date(currentDate.getTime());
      lastQuarter = lastQuarter.setMonth(lastQuarter.getMonth() -3);
      Game.aggregate([
        {$match: {name: req.params.gameName}},
        {$unwind: '$stats'},
        {$group: {
          _id: {
            $cond: { if: { $gt: [ "$stats.collectionRun.date", new Date(lastMonth) ] }, then: {
              year: {$year: "$stats.collectionRun.date"},
              month: {$month: "$stats.collectionRun.date"},
              day: {$dayOfYear: "$stats.collectionRun.date"},
              hour: {$hour: "$stats.collectionRun.date"}
            }, else: {
              $cond: { if: { $gt: [ "$stats.collectionRun.date", new Date(lastQuarter) ] }, then: {
                year: {$year: "$stats.collectionRun.date"},
                month: {$month: "$stats.collectionRun.date"},
                day: {$dayOfYear: "$stats.collectionRun.date"}
              }, else: {
                  year: {$year: "$stats.collectionRun.date"},
                  month: {$month: "$stats.collectionRun.date"}
              }}
            }}
          },
          viewers: {$first: "$stats.viewers"},
          channels: {$first: "$stats.channels"},
          date: {$first: "$stats.collectionRun.date"}
        }},
        {$project: {
          _id: 0,
          y: "$_id.year",
          m: "$_id.month",
          d: "$_id.day",
          h: "$_id.hour",
          v: "$viewers",
          c: "$channels",
          dt: "$date"
        }},
        {$sort: {
          y: 1,
          m: 1,
          d: 1,
          h: 1
        }}
      ]).exec(function (err, data) {
        cb(err, [lastCollectionRun, data]);
      });
    });

    async.waterfall(requests, function (err, result) {
      if (!result[1]) {
        return res.sendStatus(404);
      }

      res.json({
        stats: result[1],
        lastCollectionRun: {
          run: result[0]._id,
          date: result[0].date
        }
      });
    });
  });

module.exports = router;
