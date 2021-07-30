//TODO bull
'use strict';
ngivr.angular.config(function ($stateProvider) {
  $stateProvider.state('master.queue', {
    url: '/queue',
    template: '<ngivr-master-queue></ngivr-master-queue>',
  });
});
