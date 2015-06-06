var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StatsSchema = new Schema({
  viewers: {
      type: Number
  },
  channels: {
      type: Number
  },
  created_at: {
    type: Date
  }
});

StatsSchema.pre('save', function(next){
  if ( !this.created_at ) {
    this.created_at = new Date();
  }
  next();
});

module.exports = {
  model: mongoose.model('Stats', StatsSchema),
  schema: StatsSchema
};
