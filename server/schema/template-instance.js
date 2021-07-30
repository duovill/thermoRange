const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TemplateInstanceSchema = new Schema({
  // nev, pl partialName
  template: {
    type: String,
    required: true,
  },

  id: {
    type: Schema.Types.ObjectId,
    required: true
  },

  // maga a html kod
  instanceCount: {
    type: Number,
    required: true,
    default: 0,
  },

},{
  timestamps: true
});

TemplateInstanceSchema.index({template: 1, id: 1}, {unique: true});

module.exports = TemplateInstanceSchema;
