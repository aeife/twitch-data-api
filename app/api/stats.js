var express = require('express');
var Game = require('../models/game').model;
var Stats = require('../models/stats').model;
var router = express.Router();
var _ = require('lodash');
var CollectionRun = require('../models/collectionRun').model;
var async = require('async');

router.route('/stats')
  .get(function(req, res) {
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
      Stats.aggregate([
        {$match: {name: req.params.gameName}},
        {$group: {
          _id: {
            $cond: { if: { $gt: [ "$collectionRun.date", new Date(lastMonth) ] }, then: {
              year: {$year: "$collectionRun.date"},
              month: {$month: "$collectionRun.date"},
              day: {$dayOfMonth: "$collectionRun.date"},
              hour: {$hour: "$collectionRun.date"}
            }, else: {
              $cond: { if: { $gt: [ "$collectionRun.date", new Date(lastQuarter) ] }, then: {
                year: {$year: "$collectionRun.date"},
                month: {$month: "$collectionRun.date"},
                day: {$dayOfMonth: "$collectionRun.date"}
              }, else: {
                  year: {$year: "$collectionRun.date"},
                  month: {$month: "$collectionRun.date"}
              }}
            }}
          },
          viewers: {$first: "$viewers"},
          channels: {$first: "$channels"},
          date: {$first: "$collectionRun.date"}
        }},
        {$project: {
          _id: 0,
          y: "$_id.year",
          m: "$_id.month",
          d: "$_id.day",
          h: "$_id.hour",
          v: "$viewers",
          c: "$channels",
          dt: "$date",
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
        stats: result[1]
      });
    });
  });

module.exports = router;
