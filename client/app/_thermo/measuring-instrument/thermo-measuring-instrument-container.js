ngivr.angular.directive('thermoMeasuringInstrumentContainer', function() {

    return {
        templateUrl: 'app/_thermo/measuring-instrument/thermo-measuring-instrument-container.html',

        controller: function ($scope, $state, thermoMeasuringInstrumentForm) {

            $scope.newMeasuringInstrumentEditor = () => {
                thermoMeasuringInstrumentForm.show({
                    type: 'new',
                })
            }

        }
    }

} )
