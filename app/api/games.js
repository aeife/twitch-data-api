var express = require('express');
var Game = require('../models/game').model;
var router = express.Router();

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
    // get game list
    .get(function(req, res) {
        queryGames(req.query.sortAttr, req.query.sortType, req.query.fullData, req.query.order)
          .limit(parseInt(req.query.limit))
          .skip(parseInt(req.query.offset || 0))
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


        // Game
        //     .find()
        //     .limit(req.query.limit)
        //     .skip(req.query.offset)
        //     .exec(function(err, games) {
        //         if (err) {
        //             res.send(err);
        //         }
        //
        //         Game.count(function (err, count) {
        //             if (err) {
        //                 res.send(err);
        //             }
        //
        //             res.json({
        //                 games: games,
        //                 limit: req.query.limit,
        //                 offset: req.query.offset,
        //                 count: count
        //             });
        //         });
        //     });
    });

module.exports = router;
