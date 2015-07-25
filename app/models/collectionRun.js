var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CollectionRunSchema = new Schema({
    date: {
      type: Date,
      default: Date.now
    }
});

module.exports = {
  model: mongoose.model('CollectionRun', CollectionRunSchema),
  schema: CollectionRunSchema
};
