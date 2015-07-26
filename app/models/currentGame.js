var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CurrentGameSchema = new Schema({
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
    viewers: {
        type: Number
    },
    channels: {
        type: Number
    },
    ratio: {
        type: Number
    },
    collectionRun: {
        run: {
          type: Number,
          ref: 'CollectionRun'
        },
        date: {
          type: Date
        }
    }
});

module.exports = {
  model: mongoose.model('CurrentGame', CurrentGameSchema),
  schema: CurrentGameSchema
};
