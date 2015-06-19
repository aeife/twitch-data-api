var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StatsSchema = new Schema({
  viewers: {
      type: Number
  },
  channels: {
      type: Number
  },
  collectionRun: {
      type: Number,
      ref: 'CollectionRun'
  }
});

module.exports = {
  model: mongoose.model('Stats', StatsSchema, 'totalStats'),
  schema: StatsSchema
};
