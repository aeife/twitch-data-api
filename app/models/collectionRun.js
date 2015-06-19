var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var CollectionRunSchema = new Schema({
    date: {
      type: Date
    }
});

CollectionRunSchema.pre('save', function(next){
  if (!this.date) {
    this.date = new Date();
  }
  next();
});

CollectionRunSchema.plugin(autoIncrement.plugin, 'CollectionRun');

module.exports = {
  model: mongoose.model('CollectionRun', CollectionRunSchema),
  schema: CollectionRunSchema
};
