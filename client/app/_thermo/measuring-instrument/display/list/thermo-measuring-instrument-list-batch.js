ngivr.angular.directive('thermoMeasuringInstrumentListBatch', () => {
    return {
        scope: {
            thermoEquipmentMacid: '<',
            setVideo: '=',

        },
        templateUrl: 'app/_thermo/measuring-instrument/display/list/thermo-measuring-instrument-list-batch.html',
        controller: function($scope) {

            $scope.ngivrQuery = {
                search: {
                    macId: $scope.thermoEquipmentMacid
                }
            }

            $scope.setVideoOriginal = (opts) => {

                $scope.setVideo(opts);
                //console.warn('setVideo', doc)
            }
        }
    }
})
