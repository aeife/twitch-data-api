var express = require('express');
var Game = require('../models/game').model;
var router = express.Router();
router.route('/games')
    // get game list
    .get(function(req, res) {
        Game
            .find()
            .limit(req.query.limit)
            .skip(req.query.offset)
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

module.exports = router;
