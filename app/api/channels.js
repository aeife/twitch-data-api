var express = require('express');
var Channel = require('../models/channel').model;
var mongoose = require('mongoose');
var CurrentChannel = require('../models/currentChannel').model;
var CollectionRun = require('../models/collectionRun').model;
var router = express.Router();
var _ = require('lodash');
var async = require('async');

router.route('/channels')
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
      CurrentChannel
        .find(search)
        .count()
        .exec(cb);
    });

    requests.push(function (cb) {
      CurrentChannel
        .find(search)
        .limit(options.limit)
        .skip(options.offset)
        .sort(sort)
        .exec(cb);
    });

    async.parallel(requests, function (err, result) {
      res.json({
        channels: result[1],
        limit: options.limit,
        offset: options.offset,
        count: result[0]
      });
    });
  });

router.route('/channels/:channelName')
  .get(function(req, res) {
    if (!req.params.channelName || !req.params.channelName.length) {
      return res.sendStatus(404);
    }

    Channel.findOne({name: req.params.channelName}, {stats: 0, __v: 0}).exec(function (err, result) {
      if (!result) {
        return res.sendStatus(404);
      }

      res.json(result);
    });
  });

router.route('/channels/:channelName/stats')
  .get(function(req, res) {
    if (!req.params.channelName || !req.params.channelName.length) {
      return res.sendStatus(404);
    }

    var requests = [];

    requests.push(function (cb) {
      CollectionRun.findOne({}).sort({date: -1}).exec(cb);
    });

    requests.push(function (lastCollectionRun, cb) {
      var currentDate = new Date(lastCollectionRun.date);
      var lastMonth = new Date(currentDate.getTime());
      lastMonth = lastMonth.setMonth(lastMonth.getMonth() - 1);
      var lastQuarter = new Date(currentDate.getTime());
      lastQuarter = lastQuarter.setMonth(lastQuarter.getMonth() -3);
      Channel.aggregate([
        {$match: {name: req.params.channelName}},
        {$unwind: '$stats'},
        {$group: {
          _id: {
            $cond: { if: { $gt: [ "$stats.collectionRun.date", new Date(lastMonth) ] }, then: {
              year: {$year: "$stats.collectionRun.date"},
              month: {$month: "$stats.collectionRun.date"},
              day: {$dayOfMonth: "$stats.collectionRun.date"},
              hour: {$hour: "$stats.collectionRun.date"}
            }, else: {
              $cond: { if: { $gt: [ "$stats.collectionRun.date", new Date(lastQuarter) ] }, then: {
                year: {$year: "$stats.collectionRun.date"},
                month: {$month: "$stats.collectionRun.date"},
                day: {$dayOfMonth: "$stats.collectionRun.date"}
              }, else: {
                  year: {$year: "$stats.collectionRun.date"},
                  month: {$month: "$stats.collectionRun.date"}
              }}
            }}
          },
          viewers: {$first: "$stats.viewers"},
          followers: {$first: "$stats.followers"},
          date: {$first: "$stats.collectionRun.date"},
          game: {$first: "$stats.game"}
        }},
        {$project: {
          _id: 0,
          y: "$_id.year",
          m: "$_id.month",
          d: "$_id.day",
          h: "$_id.hour",
          v: "$viewers",
          f: "$followers",
          g: "$game",
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
      if (!result[1].length) {
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
