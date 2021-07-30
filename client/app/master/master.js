'use strict';

angular.module('ngIvrApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('master', {
        url: '/master',
        templateUrl: 'app/master/master.html',
        controller: 'MasterCtrl'
      });
  });