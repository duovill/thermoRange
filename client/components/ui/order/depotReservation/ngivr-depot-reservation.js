'use strict';

angular.module('ngIvrApp')
    .directive('ngivrDepotReservation', function () {
        return {
            templateUrl: 'components/ui/order/depotReservation/ngivr-depot-reservation.html',
            restrict: 'EA',
            link: function (scope, element, attrs) {
            },
            scope: {
                depots: '=',
                loadDepot: '=',
                edited: '<',
                ngivr: '<',
                form: '<',
                orderId: '<',
                loadDepotIdx: '<',
                checkedPTQuantity: '<?',
                sygnus: '<?'
            },
            controller: function ($scope, Common, ngivrHttp) {
                /**
                 * A raktárból maximálisan tervezhető mennyiséget számolja
                 * @param depot
                 */
                $scope.setMax = (depot) => {
                    let reserved = 0;
                    if ($scope.loadDepot) {
                        let loadDepot = $scope.loadDepot.filter((o) => {
                            return o.depot === depot._id.depotId
                        });
                        if (loadDepot.length) {
                            reserved = loadDepot[0].quantity
                        }
                    }
                    let max = depot.free + reserved;

                    if ($scope.checkedPTQuantity !== undefined && $scope.checkedPTQuantity < max) {
                        max = $scope.checkedPTQuantity
                    }


                    return max
                };

                /**
                 * Ha változik az order.loadDepot, akkor annak megfelelően módosul a raktárlistán a tervezett mennyiség
                 */
                $scope.$watch('loadDepot', (newLoadDepot, oldLoadDepot) => {
                    if (newLoadDepot !== oldLoadDepot) {
                        for (let depot of $scope.depots) {
                            //  if (depot._id.depotId)
                            let idx = Common.functiontofindIndexByKeyValue(newLoadDepot, 'depot', depot._id.depotId);
                            if (idx !== null) {
                                depot.quantity = newLoadDepot[idx].quantity
                            } else {
                                depot.quantity = undefined
                            }
                        }
                    }
                });

                /**
                 * A raktárból minimálisan tegezhető mennyiséget számolja
                 * Ha már volt kiszállítás, az alá a mennyiség alá nem lehet tervezni
                 * @param depot
                 */
                $scope.setMin = (depot) => {
                    let performed = 0;
                    if ($scope.loadDepot) {
                        let loadDepot = $scope.loadDepot.filter((o) => {
                            return o.depot === depot._id.depotId
                        });
                        if (loadDepot.length) {
                            performed = loadDepot[0].performed
                        }
                    }

                    return performed
                };

                $scope.clearReservation = async (reservation, index) => {
                    let idx = null;
                    if ($scope.loadDepot) {
                        idx = Common.functiontofindIndexByKeyValue($scope.loadDepot, 'depot', reservation._id.depotId);
                    }

                    if (idx !== null) {
                        if ($scope.loadDepot[idx].performed > 0) {
                            $scope.loadDepot[idx].quantity = $scope.loadDepot[idx].performed
                        } else {
                            await ngivrHttp.put('/api/orders/setReservation/' + $scope.orderId, $scope.loadDepot[idx]);
                            $scope.loadDepot.splice(idx, 1)
                        }

                    } else {
                        reservation.quantity = reservation.performed
                    }
                    $scope.form['quantity' + index].$setPristine(false);
                    $scope.form['quantity' + index].$setUntouched(true);
                    $scope.form['quantity' + index].$setValidity('wrongNumber', true);

                    //  $scope.publish('reservationCleared', {reservation: reservation, orderId: $scope.orderId})

                }
            }
        }
    });
