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
  model: mongoose.model('Stats', StatsSchema, 'generalstats'),
  schema: StatsSchema
};
