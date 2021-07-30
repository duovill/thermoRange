'use strict';
ngivr.angular.config(function ($stateProvider) {
    $stateProvider.state('master.users', {
        url: '/users',
        template: '<ngivr-master-users></ngivr-master-users>',
    });
});
