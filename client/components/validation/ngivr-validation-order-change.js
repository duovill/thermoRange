'use strict';

ngivr.angular.directive('ngivrValidationOrderChange', function ($q, $parse, Common, ngivrApi, ngivrGrowl) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$asyncValidators.ngivrValidationOrderChange = (modelValue, viewValue) => {
                //let settings = $parse(attrs.ngivrValidationOrderChange)(scope);


                let defer = $q.defer();

                if (ctrl.$isEmpty(modelValue)) {
                    defer.reject();
                    ctrl.$setViewValue(undefined);
                    ctrl.$render();
                    scope.$apply();
                }
                else {
                    ngivrApi.query('order', {
                        search: {
                            orderNumber: modelValue
                        },
                        settings: {getContractData: true}
                    }).then(async (response) => {
                        let inDirections = ['in', 'internal_in', 'external_in'];

                        if (angular.equals([], response.data.docs)) { //nincs ilyen order

                            defer.reject();
                        } else {
                            const order = response.data.docs[0];


                            if (order.orderClosed) {
                                scope.orderError = {closed: true};
                                defer.reject();
                                ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció le van zárva!');
                            } else if (order.deleted) {
                                scope.orderError = {deleted: true};
                                defer.reject();
                                ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció törölt!');
                            } else if (inDirections.includes(order.direction) && !inDirections.includes(scope.model.origOrder.direction)
                                || !inDirections.includes(order.direction) && inDirections.includes(scope.model.origOrder.direction)) {
                                scope.orderError = {direction: true};
                                defer.reject();
                                ngivrGrowl('A(z) ' + modelValue + ' sz. diszpozíció ellentétes irányú!');
                            } else {
                                scope.model.dstOrder = order;
                                scope.model.dstOrder.transportType = await scope.setTransportType(order);
                                if (order.direction === 'in' || order.direction === 'internal' && scope.ticket.direction === 'internal_in') {
                                    if (order.unloadDepot && order.unloadDepot.length) {
                                        scope.model.depotFull = order.unloadDepot[0]
                                    }
                                } else if (order.direction === 'out' || order.direction === 'internal' && scope.ticket.direction === 'internal_out') {
                                    const resp = await ngivrApi.id('depot', order.loadDepot[0].depot);
                                    scope.model.depotFull = resp.data.doc
                                }
                                scope.orderError = {};
                                defer.resolve();
                            }
                        }
                    })
                }


                return defer.promise;
            };
        }
    };
});
