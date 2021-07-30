ngivr.angular.config(function ($stateProvider) {
    $stateProvider
        .state('thermo-tests', {
            url: '/thermo-tests',
            template: '<thermo-tests></thermo-tests>',
        })
        .state('thermo-tests.convex-hull', {
            url: '/convex-hull',
            template: '<thermo-tests-convex-hull></thermo-tests-convex-hull>',
        })
        .state('thermo-tests.test', {
            url: '/test',
            template: '<thermo-tests-test></thermo-tests-test>',
        })

});

