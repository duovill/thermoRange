ngivr.angular.config(function ($stateProvider) {
    $stateProvider.state('thermo-measuring-instrument-display', {
        url: '/thermo-measuring-instrument-display/:id/:macId',
        template: '<thermo-measuring-instrument-display-container></thermo-measuring-instrument-display-container>',
    });

});

