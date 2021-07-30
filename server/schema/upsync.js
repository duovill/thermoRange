/*jshint esnext: true */
/*jshint asi:true, undef:true*/
/* global module,require */
'use strict';
var mongoose = require('mongoose'),
Schema = mongoose.Schema;

var upsync= new Schema({
  url: {
      type: String,
      required:true
  },
  rawBody: {},
  method:String
},{
    timestamps: true
});



module.exports = upsync;
