const mongoose = require('mongoose');


mongoose.dropModel = function(schemModel) {
  const model = mongoose.model(schemModel);
  model.collection.drop(function(err, works) {
    if (err) {
      console.error('mongoose.dropModel', err)
    }
    delete mongoose.models[schemModel];
    delete mongoose.modelSchemas[schemModel];
//    console.log(Object.keys(mongoose.models));
//    console.log(Object.keys(mongoose.modelSchemas) );
  });
}

Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + (h * 60 * 60 * 1000));
  return this;
};


if (!Date.prototype.toLocalISOString) {

  function pad(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }

  Date.prototype.toLocalISOString = function () {
    return this.getFullYear() +
      '-' + pad(this.getMonth() + 1) +
      '-' + pad(this.getDate()) +
      'T' + pad(this.getHours()) +
      ':' + pad(this.getMinutes()) +
      ':' + pad(this.getSeconds()) +
      '.' + (this.getMilliseconds() / 1000).toFixed(3).slice(2, 5) +
      'Z';
  };
}
