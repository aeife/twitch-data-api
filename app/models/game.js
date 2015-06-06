var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StatsSchema = require('./stats').schema;

var GameSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    stats: [StatsSchema]
});

module.exports = {
  model: mongoose.model('Game', GameSchema),
  schema: GameSchema
};
