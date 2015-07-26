var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StatsSchema = require('./stats').schema;

var GameSchema = new Schema({
    name: {
        type: String,
        unique: true,
        index: true
    },
    twitchGameId: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    giantbombId: {
      type: Number
    },
    stats: [StatsSchema]
});

module.exports = {
  model: mongoose.model('Game', GameSchema),
  schema: GameSchema
};
