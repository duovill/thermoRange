ngivr.angular.directive('thermoTests', function() {

    return {
        templateUrl: 'app/_thermo/thermo-tests/thermo-tests.html',

        controller: function ($scope, $state) {

            $state.go('thermo-tests.convex-hull')



        }
    }

} )
