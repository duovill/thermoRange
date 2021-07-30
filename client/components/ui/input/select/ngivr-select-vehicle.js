'use strict';
ngivr.angular.directive('ngivrSelectVehicle', function (ngivrService, ngivrInput) {

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            orderId: '=',
            plateNumber1: '<',
            plateNumber2: '<',
            loadLocationId: '<',
            unloadLocationId: '<',
            fieldToShow: '@',
            setLoadDate: '&?',
            ledgerIndex: '<?',
            watchPlateNumber: '<?',
            origTcn: '<?',
            productId: '<?',
            loadedWeight: '<',
            direction: '<?'
        },
        template: `
<md-select class="ngivr-select"  ng-model="model" ng-model-options="{ trackBy: '$value._id'}" md-on-close="setLoadDate({index: ledgerIndex})">
  <md-option ng-repeat="vehicle in vehicles" ng-value="vehicle"  >
    {{ vehicle[fieldToShow] }}
  </md-option>
</md-select>
`,
        link: function (scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);

            const dataQuery = ngivrService.data.query({
                $scope: scope,
                schema: 'orderVehicle',
                url: '/api/orderVehicles/getForTicketGenerator/' + scope.loadLocationId + '/' + scope.unloadLocationId + '/' + scope.orderId + '/' + scope.productId,
                subscribe: async (promise) => {
                    try {
                        const response = await promise;
                        const data = Object.assign({}, response.data.docs);
                        scope.vehicles = data;
                        delete data['docs'];
                    } catch (e) {
                        ngivr.growl.error(e);
                    }
                }
            });

            if (scope.watchPlateNumber) {
                scope.$watch('plateNumber1', (newVal, oldVal) => {
                    if (newVal) {
                        dataQuery.query({
                            limit: 0,
                            search: {
                                plateNumber1: scope.plateNumber1,
                                plateNumber2: scope.plateNumber2,
                                deleted: false,
                                ticketDeleted: {$ne: true},
                                $or: [
                                    {tcnUsed: false},
                                    {tcn: scope.origTcn}
                                ]

                            },
                            sort: {'createdAt': -1}
                        })
                    } else {
                        scope.vehicles = []
                    }
                })
            } else {
                let search = {
                    $and: [
                        {plateNumber1: scope.plateNumber1},
                        {plateNumber2: scope.plateNumber2},
                        {deleted: false},
                        {ticketDeleted: {$ne: true}},
                        // {outTicketDeleted: {$ne: true}},
                        // {inTicketDeleted: {$ne: true}},
                        //{$or: [{tcnUsed: {$ne: true}}, {tcnUsed: {$exists: false}} ]}
                    ]
                };
                if (scope.direction !== 'internal_in') {
                    search.$and.push({$or: [{tcnUsed: {$ne: true}}, {tcnUsed: {$exists: false}}]})
                    // search.$and.push({outTicketDeleted: {$ne: true}})
                    //     search.$and.push({inTicketDeleted: {$ne: true}})
                } else if (scope.direction === 'internal_in') {
                    search.$and.push({outTicketDeleted: {$ne: true}});
                    search.$and.push({inTicketDeleted: {$ne: true}})
                }
                dataQuery.query({
                    limit: 0,
                    search: search,


                    sort: {'createdAt': -1}
                })
            }


        },
    }
});
