'use strict';
ngivr.angular.service('ngivrService', function(ngivrConfirm, ngivrForm, ngivrData, ngivrApi, ngivrHttp, ngivrException, ngivrDebounce) {
  var self = this;

  // global data
  self.config = ngivr.config;
  self.strings = ngivr.strings;
  self.growl = ngivr.growl;
  self.settings = ngivr.settings;
  self.event = ngivr.event;
  self.translate = ngivr.translate;

  // injected data
  self.confirm = ngivrConfirm;
  self.debounce = ngivrDebounce;
  self.form = ngivrForm;
  self.data = ngivrData;
  self.api = ngivrApi;
  self.http = ngivrHttp;
  self.exception = ngivrException;

  ngivr.service = self;

});
