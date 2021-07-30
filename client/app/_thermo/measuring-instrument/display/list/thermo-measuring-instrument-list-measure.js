ngivr.angular.directive('thermoMeasuringInstrumentListMeasure', () => {
    return {
        scope: {
            thermoEquipmentMacid: '<',
        },
        templateUrl: 'app/_thermo/measuring-instrument/display/list/thermo-measuring-instrument-list-measure.html',
        controller: function ($scope) {

            $scope.ngivrQuery = {
                search: {
                    macId: $scope.thermoEquipmentMacid
                },
                restricted: [
                ]
            }
            $scope.ngivrRestricted = [
                'cloudPoints'
            ]


            $scope.showPointCloud = ({ doc}) => {
                $scope.$emit('thermo-load-point-clouds', doc._id)
            }
        }
    }
})
