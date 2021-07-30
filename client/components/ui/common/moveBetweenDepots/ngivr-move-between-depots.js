'use strict';

ngivr.angular.directive('ngivrMoveBetweenDepots', () => {
    return {
        restrict: 'E',
        scope: {
            ngModel: '=',
            userSite: '<'
        },
        templateUrl: 'components/ui/common/moveBetweenDepots/ngivr-move-between-depots.html',
        controllerAs: '$ctrl',
        controller: class {
            constructor($scope, ngivrHttp, ngivrConfirm, ngivrService, ngivrGrowl) {
                $scope.ngivr = ngivrService;
                $scope.Math = window.Math;
                $scope.model = {};

                if ($scope.userSite) {
                    $scope.model.srcSite = $scope.userSite
                }

                /**
                 * Lekéri adott site, és termény alapján a Sygnusos készletet, raktáranként és terményenként csoportosítva
                 * @param options
                 * @returns {Promise.<void>}
                 */
                $scope.getDepots = async (options) => {
                    // if ($scope.model.partner || $scope.model.product || $scope.model.srcSite) {
                    //     let query = {
                    //         partnerId: $scope.model.partner ? $scope.model.partner._id : options.partnerId ? options.partnerId : undefined,
                    //         siteId: $scope.model.srcSite ? $scope.model.srcSite._id : options.siteId ? options.siteId : undefined,
                    //         productId: $scope.model.product ? $scope.model.product._id : options.productId ? options.productId : undefined,
                    //         serviceContractId: $scope.model.sourceServiceContract ? $scope.model.sourceServiceContract._id : options.serviceContractId ? options.serviceContract._id : undefined
                    //     };
                    //     ngivrHttp.get('api/depots//getDepotsByParameters/', {params: query}).then((response) => {
                    //         $scope.model.depotsWithProduct = response.data.depots;
                    //     })
                    // } else {
                    //     $scope.model.depotsWithProduct = []
                    // }
                };

                $scope.$watch('model.partner', (newVal, oldVal) => {
                    if (newVal === undefined || newVal === null) {
                        $scope.model.sourceServiceContract = undefined;
                        $scope.model.actualServiceContract = undefined
                    }
                });

                $scope.$watchGroup(['model.product', 'model.srcSite', 'model.partner'], (newVal, oldVal) => {
                    if (!newVal[2]) {
                        $scope.model.depotsWithProduct = []
                        $scope.enabledIdx = undefined
                        return
                    }
                    let origStorage = {};
                    if ($scope.enabledIdx !== undefined) {
                        origStorage = {
                            id: $scope.model.depotsWithProduct[$scope.enabledIdx]._id.storageId,
                            amount: $scope.model.depotsWithProduct[$scope.enabledIdx].amount
                        }
                    }
                    if (newVal[0] || newVal[1] || newVal[2]) {
                        let query = {
                            partnerId: $scope.model.partner._id,
                            siteId: newVal[1] ? newVal[1]._id : undefined,
                            productId: newVal[0] ? newVal[0]._id : undefined,
                            serviceContractId: undefined
                        };
                        ngivrHttp.get('api/depots//getDepotsByParameters/', {params: query}).then((response) => {
                            $scope.model.depotsWithProduct = response.data.depots;
                            $scope.enabledIdx = undefined;
                            if (origStorage.id) {
                                for (let i in $scope.model.depotsWithProduct) {
                                    if ($scope.model.depotsWithProduct[i]._id.storageId === origStorage.id) {
                                        $scope.model.depotsWithProduct[i].amount = origStorage.amount;
                                        $scope.enabledIdx = Number(i);
                                        break
                                    }
                                }
                            }
                        })


                    } else {
                        $scope.model.depotsWithProduct = []
                    }
                });

                /**
                 * Beállítja, hogy melyik mezők legyenek inaktívak
                 * @param idx
                 * @param value
                 */
                $scope.setDisabled = (idx, value) => {
                    if (value === null) {
                        $scope.enabledIdx = undefined
                    } else $scope.enabledIdx = idx

                };

                /**
                 * Ellenőrzi a mező írhatóságát
                 * @param idx
                 * @returns {boolean}
                 */
                $scope.isDisabled = (idx) => {
                    if ($scope.enabledIdx !== undefined) {
                        return $scope.enabledIdx !== idx
                    }
                    return false
                };

                /**
                 * Mentés, a kívánt mennyiségek átadása másik partnernek
                 * @param form
                 */
                $scope.moveBetweenDepots = (form) => {
                    if (!$scope.ngivr.form.validate(form)) return;
                    let depotId;
                    let amount;
                    for (let depot of $scope.model.depotsWithProduct) {
                        if (depot.amount) {
                            depotId = depot._id;
                            amount = depot.amount
                        }
                    }
                    if (!amount) {
                        ngivrGrowl('Nem adott meg mennyiséget!');
                        return
                    }
                    ngivrConfirm('Biztosan menteni kívánja?', 'A mentés folyamatban').then(async function () {
                        try {
                            let url = '/api/depots/' + depotId.depotId + '/' + $scope.model.dstDepot._id + '/'
                                + depotId.productId + '/' + depotId.partnerId + '/' + amount + '/' + $scope.model.fulfillmentDate;
                            url += '/' + ($scope.model.sourceServiceContract ? $scope.model.sourceServiceContract._id : undefined);
                            url += '/' + ($scope.model.actualServiceContract ? scope.model.actualServiceContract._id : undefined);
                            await ngivrHttp.put(url);
                            if ($scope.userSite) {
                                $scope.model = {srcSite: $scope.userSite}
                            } else {
                                $scope.model = {}
                            }
                            $scope.ngivr.form.clear(form);
                            ngivrGrowl('A mentés sikeres volt');
                            // let query = {
                            //     partnerId: $scope.model.partner ? $scope.model.partner._id : undefined,
                            //     siteId: $scope.model.srcSite ? $scope.model.srcSite._id : undefined,
                            //     productId: $scope.model.product ? $scope.model.product._id : undefined,
                            //     serviceContractId: $scope.model.sourceServiceContract ? $scope.model.sourceServiceContract._id : $scope.model.serviceContractId ? $scope.model.serviceContract._id : undefined
                            // };
                            // ngivrHttp.get('api/depots//getDepotsByParameters/', {params: query}).then((response) => {
                            //     $scope.model.depotsWithProduct = response.data.depots;
                            // });
                            //$scope.model = {};
                            $scope.enabledIdx = undefined
                        } catch (e) {
                            ngivrGrowl('Hiba: "' + e.data.message + '"')
                        }
                    })
                }
            }
        }
    };
});
