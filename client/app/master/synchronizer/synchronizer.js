'use strict';

angular.module('ngIvrApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('master.synchronizer', {
        url: '/master/synchronizer',
        templateUrl: 'app/master/synchronizer/synchronizer.html',
        controller: 'synchronizerCtrl'
      });
  });
