var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CurrentChannelSchema = new Schema({
    name: {
        type: String,
        index: true
    },
    displayName: {
        type: String,
        index: true
    },
    twitchChannelId: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    viewers: {
        type: Number
    },
    followers: {
      type: Number
    },
    views: {
      type: Number
    },
    logo: {
      type: String
    },
    game: {
      type: String
    },
    created: {
      type: Date
    },
    collectionRun: {
        run: {
          type: Schema.Types.ObjectId,
          ref: 'CollectionRun'
        },
        date: {
          type: Date
        }
    }
});

module.exports = {
  model: mongoose.model('CurrentChannel', CurrentChannelSchema),
  schema: CurrentChannelSchema
};
