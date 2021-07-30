'use strict';
ngivr.angular.directive('ngivrPopupSelectDepot', (ngivrService) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        // require: 'ngModel',
        transclude: true,
        scope: {
            order: '=',
            edited: '<',
            ngDisabled: '<'
        },
        link: (scope, elm, attrs, ctrl) => {
            if (attrs.type === undefined) {
                attrs.type = 'popup';
            }

        },
        template: `<div >
                        <ngivr-button ng-click="ngDisabled || !order.depotsWithProduct.length || showAdvanced($event)" ng-disabled="ngDisabled">                     
                                    <md-tooltip>Raktár választása</md-tooltip>
                                    {{!order.depotsWithProduct.length && !ngDisabled ? 'Nincs készlet' : 'Raktár választása'}}</ngivr-button>              
                  </div>              
      `,
        controller: function ($scope, $mdDialog) {

            $scope.ngivr = service;
            $scope.origTechnicalPerformId = $scope.order.technicalPerformId;

            $scope.showAdvanced = function (ev) {

                $mdDialog.show({
                    controller: PopupController,
                    templateUrl: 'components/ui/popup/selectLoadDepotForOrder/ngivr-popup-select-depot.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: !$scope.order.sygnus, // Only for -xs, -sm breakpoints.
                    order: $scope.order,
                    edited: $scope.edited,
                    origTechnicalPerformId: $scope.origTechnicalPerformId,
                    ngivr: $scope.ngivr,

                })
                    .then(function (answer) {
                        $scope.status = 'You said the information was "' + answer + '".';

                    }, function (product) {
                        $scope.status = 'You cancelled the dialog.';

                    });
            };

            function PopupController($scope, $mdDialog, ngivr, order, origTechnicalPerformId, ngivrApi, Common, socket, edited) {
                const start = async () => {
                    $scope.ngivr = ngivr;
                    $scope.order = order;
                    $scope.edited = edited;
                    $scope.origtechnicalPerformId = origTechnicalPerformId;
                    $scope.origDepotsWithProduct = angular.copy($scope.order.depotsWithProduct);

                    if (!$scope.order.sygnus && $scope.order.selectedSourceServiceContract.possessionTransfer) {


                        const dataQuery = ngivrService.data.query({
                            $scope: $scope,
                            schema: 'ticket',
                            url: '/api/tickets/get-possession-transfers',
                            subscribe: async (promise) => {
                                try {
                                    const response = await promise;
                                    $scope.possessionTransfers = response.data;
                                    for (let pt of $scope.possessionTransfers) {
                                        let resp = await ngivrApi.id('contract', pt.ledger[0].contractId);
                                        pt.contractNumber = resp.data.doc.contractNumber;
                                        if ($scope.order.technicalPerformId && $scope.order.technicalPerformId === pt._id) {
                                            pt.checked = true
                                        }
                                        let res = 0;
                                        for (let i in pt.technicalReservations) {
                                            if (pt.technicalReservations[i].orderId !== $scope.order._id) {
                                                res += pt.technicalReservations[i].quantity - pt.technicalReservations[i].performed
                                            }

                                        }
                                        pt.free = pt.technicalRemain - res
                                    }
                                    $scope.origPts = angular.copy($scope.possessionTransfers);
                                } catch (e) {
                                    ngivr.growl.error(e);
                                }
                            }
                        });

                        dataQuery.query({
                            limit: 0,
                            search: {
                                deleted: false,
                                sygnus: false,
                                direction: 'in',
                                ticketType: 'possessionTransfer',
                                'site.siteId': $scope.order.loadLocation[0]._id,
                                'ownerId': $scope.order.partner[0]._id,
                                'ledger.actualServiceContractId': $scope.order.selectedSourceServiceContract._id
                            },
                            sort: 'createdAt'
                        });

                        const listener = (data) => {
                            dataQuery.query({
                                limit: 0,
                                search: {
                                    deleted: false,
                                    sygnus: false,
                                    direction: 'in',
                                    ticketType: 'possessionTransfer',
                                    'site.siteId': $scope.order.loadLocation[0]._id,
                                    'ownerId': $scope.order.partner[0]._id,
                                    'ledger.actualServiceContractId': $scope.order.selectedSourceServiceContract._id
                                },
                                sort: 'createdAt'
                            });
                        };

                        socket.socket.on("technicalRemainReservation: changed", listener);

                        $scope.$on('$destroy', async () => {

                            socket.socket.removeListener('technicalRemainReservation: changed', listener);

                        });
                    }


                    /**
                     * Ha változik a kiválasztott birtokátruházó,
                     * akkor törli az eddigi kiválasztást,
                     * és az orderbe bekerül, hogy melyik birtokátruházóra
                     * megy a technikai teljesítés
                     * @param idx
                     */
                    $scope.setCheckbox = (idx) => {
                        for (let i in $scope.possessionTransfers) {
                            $scope.possessionTransfers[i].checked = i == idx;
                        }
                        $scope.order.technicalPerformId = $scope.possessionTransfers[idx]._id;
                        $scope.checkedPTQuantity = $scope.possessionTransfers[idx].free
                    };

                    $scope.subscribe('popupSelectDepotMustClose', () => {
                        $scope.cancel()
                    });


                    $scope.cancel = function () {
                        $scope.order.technicalPerformId = $scope.origtechnicalPerformId;
                        $scope.order.depotsWithProduct = angular.copy($scope.origDepotsWithProduct);
                        if ($scope.possessionTransfers && $scope.possessionTransfers.length) {
                            for (let pt of $scope.possessionTransfers) {

                                if ($scope.order.technicalPerformId && $scope.order.technicalPerformId === pt._id) {
                                    pt.checked = true

                                } else {
                                    pt.checked = false
                                }
                            }
                        }
                        $mdDialog.cancel();
                    };

                    $scope.answer = function (answer) {
                        if ($scope.possessionTransfers && $scope.possessionTransfers.length) {
                            let idx = Common.functiontofindIndexByKeyValue($scope.possessionTransfers, 'checked', true);
                            if (idx === null) {
                                ngivr.growl('Birtokátruházó kiválasztása kötelező!');
                                return
                            }


                        }
                        if (!$scope.ngivr.form.validate($scope.popupSelectDepotForm)) {
                            throw new Error("Sikertelen form validáció");
                        }
                        if ($scope.order.depotsWithProduct && $scope.order.depotsWithProduct.length) {
                            $scope.order.volume = 0;
                            if (!$scope.order.loadDepot) {
                                $scope.order.loadDepot = [];
                            }

                            for (let depot of $scope.order.depotsWithProduct) {
                                if (depot.quantity) {
                                    $scope.order.volume += depot.quantity;
                                    let idx = Common.functiontofindIndexByKeyValue($scope.order.loadDepot, 'depot', depot._id.depotId);
                                    if (idx !== null) {
                                        $scope.order.loadDepot[idx].quantity = depot.quantity;
                                    } else {
                                        $scope.order.loadDepot.push({
                                            depotName: depot.depotName,
                                            depot: depot._id.depotId,
                                            quantity: depot.quantity,
                                            product: depot._id.productId,
                                            performed: 0
                                        })
                                    }

                                }
                            }
                            if (!$scope.order.volume) {
                                ngivr.growl('Mennyiség megadása kötelező');
                                return
                            }
                        }
                        $mdDialog.cancel();

                    };

                };

                start()

            }
        }
    }
});
