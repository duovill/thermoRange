'use strict';

ngivr.angular.directive('ngivrReQualification', () => {
    return {
        restrict: 'E',
        scope: {
            ngModel: '=',
            userSite: '<'
        },
        templateUrl: 'components/ui/common/reQualification/ngivr-re-qualification.html',
        controllerAs: '$ctrl',
        controller: class {
            constructor($scope, ngivrHttp, ngivrConfirm, ngivrService, ngivrException) {
                $scope.ngivr = ngivrService;
                $scope.Math = window.Math;
                $scope.model = {partner: ngivr.settings.ownFirm};

                const start = async () => {
                    /**
                     * Lekéri adott site, és termény alapján a Sygnusos készletet, raktáranként és terményenként csoportosítva
                     * @param options
                     * @returns {Promise.<void>}
                     */
                    $scope.getDepots = async (options) => {
                        // if ($scope.model.product || $scope.model.srcSite || $scope.model.partner) {
                        //     let query = {
                        //         partnerId: options.partnerId ? options.partnerId : undefined,
                        //         siteId:  options.siteID ? options.siteID : undefined,
                        //         productId:  options.productId ? options.productId : undefined,
                        //         serviceContractId: $scope.model.sourceServiceContract ? $scope.model.sourceServiceContract._id : options.serviceContractId ? options.serviceContract._id : undefined
                        //     };
                        //     ngivrHttp.get('api/depots//getDepotsByParameters/', {params: query}).then((response) => {
                        //         $scope.model.depotsWithProduct = response.data.depots;
                        //     })
                        // } else {
                        //     $scope.model.depotsWithProduct = []
                        // }
                    };


                    $scope.$watchGroup(['model.product', 'model.srcSite', 'model.partner'], (newVal, oldVal) => {
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

                    if ($scope.userSite) {
                        $scope.model.srcSite = $scope.userSite;
                        await $scope.getDepots({siteID: $scope.userSite._id, partnerId: $scope.model.partner._id})
                    }

                    $scope.$watch('model.partner', (newVal, oldVal) => {
                        if (newVal === undefined || newVal === null) {
                            $scope.model.sourceServiceContract = undefined;
                            $scope.model.actualServiceContract = undefined
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
                     * Mentés, a kívánt mennyiség átminősítése
                     * @param form
                     */
                    $scope.submitReQualification = async (form) => {
                        if (!$scope.model.depotsWithProduct.length) {
                            ngivr.growl('Nincs készlet a kiválasztott terményből!');
                            return
                        }
                        let hasAmount = false;
                        for (let depot of $scope.model.depotsWithProduct) {
                            if (depot.amount) {
                                hasAmount = true;
                                break
                            }

                        }
                        if (!hasAmount) {
                            ngivr.growl('Az átminősítendő mennyiséget meg kell adni!');
                            return
                        }
                        if (!$scope.ngivr.form.validate(form)) return;
                        //console.log($scope.model)
                        try {
                            let reQualification = {
                                productId: $scope.model.newProduct._id,
                                depotId: $scope.model.depotsWithProduct[$scope.enabledIdx]._id.depotId,
                                storageId: $scope.model.depotsWithProduct[$scope.enabledIdx]._id.storageId,
                                amount: $scope.model.depotsWithProduct[$scope.enabledIdx].amount,
                            };
                            console.log(reQualification);

                            let response = await ngivrHttp.post('/api/tickets/requalify', reQualification);

                            if (response.data.result === 'success') {
                                $scope.model.depotsWithProduct[$scope.enabledIdx].amount = undefined;
                                let query = {
                                    partnerId: $scope.model.partner._id,
                                    siteId: $scope.model.srcSite ? $scope.model.srcSite._id : undefined,
                                    productId: $scope.model.product ? $scope.model.product._id : undefined,
                                    serviceContractId: undefined
                                };
                                ngivrHttp.get('api/depots//getDepotsByParameters/', {params: query}).then((response) => {
                                    $scope.model.depotsWithProduct = response.data.depots;
                                    $scope.enabledIdx = undefined;
                                    if ($scope.userSite) {
                                        $scope.model.srcSite = $scope.userSite
                                    } else {
                                        $scope.model.srcSite = undefined
                                    }
                                    $scope.model.newProduct = undefined
                                    $scope.model.product = undefined
                                    $scope.ngivr.form.clear(form);
                                    ngivr.growl('A termény átminősítése sikeres volt')
                                })


                            }
                        } catch (error) {
                            if (error !== undefined) {
                                ngivrException.handler(error)
                            }
                        }
                    }
                };


                start()

            }
        }
    };
});
