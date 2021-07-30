'use strict';
ngivr.angular.directive('ngivrFormPossessionTransfer', (ngivrService) => {
    const service = ngivrService;

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            ngivrId: '=',
            content: '=',
            tabIndex: '<',
            ngivrClose: '&',
            possessionTransfer: '=?'
        },
        templateUrl: 'components/ui/form/ngivr-form-possession-transfer.html',
        controller: function ($scope, $http, Common, syncedCache, Auth, socket, ngivrApi, ngivrHttp, $timeout, ngivrLockService) {

            // const ngivrFormLockSubscriber = (locksData) => {
            //     $scope.redisLockList = locksData.locks;
            //
            //     $timeout(() => $scope.$apply());
            // };
            //
            // ngivrLockService.subscribe(ngivrFormLockSubscriber);

            // $scope.$on('$destroy', async () => {
            //     await ngivrLockService.unlockMore();
            //    // ngivrLockService.unsubscribe(ngivrFormLockSubscriber)
            // });
            $scope.ngivr = service;

            let options = {
                contract: $scope.content,
                user: Auth.getCurrentUser(),
                storedPrice: !$scope.content.buy
            };

            let ownFirm = {};

            const start = async () => {
                ownFirm = await ngivrApi.id('partner', ngivr.settings.ownFirm._id);
                $scope.model.ownerId = ownFirm.data.doc._id;
                $scope.model.ownerName = ownFirm.data.doc.name;
            };

            $scope.model = new ngivr.model.possessionTransfer(options);

            start();

            /**
             * Eladás esetén figyeli a raktárat,
             * ha saját raktár, akkor lesz tárolási díj
             */
            if (!$scope.content.buy) {
                $scope.$watch('model.depot', (newVal, oldVal) => {
                    if (newVal && newVal.site && newVal.site[0].privat) {
                        $scope.model.storedPrice = true
                    } else {
                        $scope.model.storedPrice = false
                    }

                });
            }

            $scope.unLockOrdersAndContract = () => {
                $scope.publish('possessionTransferFormClosed')
            };
            $scope.hasStoredPrice = false;
            $scope.btnStoredPrice = function (param) {
                $scope.hasStoredPrice = param;
            };

            syncedCache.loadCurrencies().then(function () {
                $scope.currencies = syncedCache.currencies;
            });

            $scope.maxValues = {
                contract: 0,
                depot: 0
            };

            /**
             * Szerződés szerinti maximálisan birtokátruházható mennyiséget kalkulálja
             * @param contract
             * @returns {number}
             */
            $scope.setFreeQuantity = function (contract) {
                let reserved = 0;

                for (let i in contract.reserved.orders) {
                    reserved += contract.reserved.orders[i].weight
                }
                for (let i in contract.reserved.plans) {
                    reserved += contract.reserved.plans[i].weight
                }
                for (let i in contract.reserved.possessionTransfers) {
                    reserved += contract.reserved.possessionTransfers[i].weight
                }
                //    console.log($scope.filteredDepots);
                $scope.maxValues.contract = contract.quantity - reserved;
                let tempQuantity = contract.quantity;
                if (contract.percent && contract.percentPlusValue) {
                    tempQuantity = contract.quantity + parseFloat((contract.quantity * contract.percentPlusValue / 100).toFixed(3))
                }
                $scope.maxValues.contract = tempQuantity - reserved;
                return contract.quantity - reserved;
            };

            /**
             * Birtokátruházható mennyiség maximumát kalkulálja
             * @param contract
             * @returns {number}
             */
            $scope.setMaxQuantity = (contract) => {
                // if (!contract.buy) {
                if ($scope.ownDepots && $scope.ownDepots.length && $scope.model.depot && $scope._isOwnSite) {
                    let depot = $scope.ownDepots.filter((o) => {
                        return o._id.depotId === $scope.model.depot._id && o._id.productId === contract.product[0]._id
                    });
                    $scope.maxValues.depot = depot.length ? depot[0].free : 0;
                    return $scope.maxValues.depot <= $scope.maxValues.contract ? $scope.maxValues.depot : $scope.maxValues.contract
                }
                if ($scope.itkDepots && $scope.itkDepots.length && $scope.model.depot && !$scope._isOwnSite) {
                    let depot = $scope.itkDepots.filter((o) => {
                        return o._id.depotId === $scope.model.depot._id && o._id.productId === contract.product[0]._id
                    });
                    $scope.maxValues.depot = depot.length ? depot[0].free : 0;
                    return $scope.maxValues.depot <= $scope.maxValues.contract ? $scope.maxValues.depot : $scope.maxValues.contract
                }
                return $scope.maxValues.contract


            };

            /**
             * Saját telephely / ITK rádio gomb
             * @param param
             */
            $scope.isOwnSite = async function (param) {
                $scope.model.depot = undefined;
                let ownerId = $scope.content.buy ? $scope.content.partner[0]._id : ngivr.settings.ownFirm._id;
                $scope._isOwnSite = param;
                $scope.model.possessionTransfer.dueDate = undefined;
                if (param === false) {
                    $scope.selectedSite = undefined;

                    let query = {
                        partnerId: ownerId,

                        productId: $scope.content.product[0]._id,
                        own: false
                    };
                    let response = await ngivrHttp.get('api/depots/getDepotsByParameters', {params: query});
                    $scope.itkDepots = response.data.depots;

                }
            };

            $http.get('/api/depots/itkDepots').then(function (depots) {
                $scope.ownSiteDepots = depots.data.ownSiteDepots; //saját telephelyez tartozó raktárak
                $scope.itkDepots = depots.data.itkDepots; //ITK raktárak
            });

            $scope.changeSites = async (site) => {
                $scope.selectedSite = site;
                let ownerId = $scope.content.buy ? $scope.content.partner[0]._id : ngivr.settings.ownFirm._id;
                $scope.model.depot = undefined;
                let query = {
                    partnerId: ownerId,
                    siteId: site._id,
                    productId: $scope.content.product[0]._id,
                    own: true
                };
                let response1 = await ngivrHttp.get('api/depots/getDepotsByParameters', {params: query});
                $scope.ownDepots = response1.data.depots;

                let response2 = await ngivrHttp.get('api/depots/getWithProductTypes/' + site._id + '/' + ngivr.settings.ownFirm._id + '/' + $scope.content.product[0].productGroupName);
                $scope.depots = response2.data.depots;
                // console.log($scope.depots)
                $scope.filteredDepots = $scope.depots.filter((o) => {
                    return o._id.productId === $scope.content.product[0]._id
                });
                $scope.selectedSite = site;

            };

            /**
             * Mentés
             * @type {{validate: (()), before: (()), after: (()), error: (())}}
             */
            $scope.ngivrFormSave = {
                validate: () => {
                    //ngivr.growl('before validate');
                },
                before: () => {
                    let depot;
                    if ($scope._isOwnSite) {
                        depot = $scope.ownDepots.filter((o) => {
                            return o._id.depotId === $scope.model.depot._id
                        })[0]
                    }

                    $scope.model.depot.depotId = $scope.model.depot._id;
                    $scope.model.site = {
                        siteId: $scope.model.depot.site[0]._id,
                        name: $scope.model.depot.site[0].name
                    };
                    $scope.model.ledger[0].unloadedWeight = $scope.model.ledger[0].loadedWeight;
                    $scope.model.contractId = $scope.model.ledger[0].contractId;
                    let offset = $scope.model.fulfillmentDate.getTimezoneOffset();
                    $scope.model.fulfillmentDate.setTime($scope.model.fulfillmentDate.getTime() + (-1 * offset * 60 * 1000));
                    $scope.model.loadDate = $scope.model.fulfillmentDate;
                    $scope.model.arrivalDate = $scope.model.fulfillmentDate;
                    if ($scope.model.direction === 'out') {
                        $scope.inTicket = JSON.parse(JSON.stringify($scope.model));
                        let modified = {
                            direction: 'in',
                            ownerId: $scope.content.partner[0]._id,
                            ownerName: $scope.content.partner[0].name,
                            sygnus: false,
                        };
                        Object.assign($scope.inTicket, modified);
                        if ($scope.model.serviceContract) {
                            $scope.inTicket.ledger[0].actualServiceContractId = $scope.model.serviceContract._id
                        }

                    } else if ($scope.model.depot.site[0].privat && $scope.model.direction === 'in') {
                        $scope.outTicket = JSON.parse(JSON.stringify($scope.model));
                        let modified = {
                            direction: 'out',
                            ownerId: $scope.content.partner[0]._id,
                            ownerName: $scope.content.partner[0].name,
                            sygnus: false
                        };

                        Object.assign($scope.outTicket, modified);
                        if (depot && depot._id && depot._id.serviceContractId) {
                            $scope.outTicket.ledger[0].sourceServiceContractId = depot._id.serviceContractId
                        }
                    }
                    return new Promise((resolve) => {
                        //ngivr.growl('before save');
                        resolve(true);
                    });
                },
                after: async () => {

                    ngivr.growl($scope.model.depot.name + ' ' + $scope.model.ledger[0].loadedWeight + ' mt');
                    $scope.publish('afterPtSave', {
                        possessionTransfer: $scope.model,
                            index: $scope.tabIndex,
                            inTicket: $scope.inTicket,
                            outTicket: $scope.outTicket
                    });

                    $timeout(() => $scope.ngivrClose(), ngivr.settings.debounce);

                    //$scope.ngivrClose();
                    // $scope.publish('possessionTransferCreated', {
                    //     possessionTransfer: $scope.model,
                    //     tabIndex: $scope.tabIndex
                    // })
                },
                error: () => {
                    return new Promise((resolve) => {
                        ngivr.growl('after error');
                        resolve(true);
                    });
                }
            };

            $scope.ngivrFormLoad = {
                before: () => {
                    return new Promise((resolve) => {
                        ngivr.growl('before load');
                        resolve(true);
                    });
                },
                after: () => {
                    ngivr.growl('after load');
                },
                error: () => {
                    return new Promise((resolve) => {
                        ngivr.growl('after error');
                        resolve(true);
                    });
                }
            };

            /**
             * Paritás megjelenítése az kapcsolódó szerződés adataiban
             * @returns {string}
             */
            $scope.getParityPlaces = (content) => {


                let string = '';
                for (let i in content.parityPlaces) {
                    string += content.parityPlaces[i].name + (i < content.parityPlaces.length - 1 ? ', ' : '')
                }
                return string


            };

        }
    }
});
