/**
 * Created by Kovács Marcell on 2017.03.16..
 */
'use strict';
ngivr.angular.directive('ngivrOrder', ($q, ngivrService, Common, $http, ngivrConfirm, $filter, ngivrApi, ngivrHttp, $timeout) => {
    const service = ngivrService;
    // let formIndex = 0;
    return {
        restrict: 'E',
        require: '?ngModel',
        transclude: true,
        scope: {
            order: '=',
            disabled: '=',
            tab: "=",
            loadPlace: '<',
            ownFirm: '=?',
            buttonDisabled: "<?ngDisabled",
            buttonTitle: '@',
            buttonTitleAlt: '@',
            idx: '<',
            cancelOrderShipOn: '&?',
            isInList: '<?',
            hideVehicleList: '<?',
            accordion: '<?',
            edited: '=?',
            removeOrderTab: '&?',
            removeDispoTab: '&?'
        },
        templateUrl: 'components/ui/order/ngivr-order.html',
        link: function (scope, element, attr) {
            scope.parentFormName = element.parents('form').attr('name');

        },
        controller: function ($scope, $mdDialog, socket, ngivrGrowl, Auth, ngivrLock, $mdMedia, ngivrLockService) {

            if ($scope.accordion === undefined) {
                $scope.accordion = $scope.order.orderNumber ? false : true;
            }


            const start = async () => {
                $scope.$mdMedia = $mdMedia;
                $scope.edited = {order: false};

                $scope.$watch('edited', (newVal, oldVal) => {
                    console.warn(oldVal)
                    console.warn(newVal)
                }, true)

                if (!$scope.ownFirm) {
                    const query = await ngivrService.data.query({schema: 'partner'}).query({search: {_id: ngivr.settings.ownFirm._id}});
                    $scope.ownFirm = query.data.docs[0];
                }

                if ($scope.order.orderNumber) {
                    $scope.fileName = ($scope.order.orderNumber.replace(/\s|\./g, '_') + ngivr.strings.fileName.orderTicketList) + '.xlsx'
                }


                $scope.currentUser = Auth.getCurrentUser();
                // formIndex++;
                // const thisFormIndex = formIndex;
                $scope.ngivr = service;
                // $scope.socketService = ngivrSocketLock;
                $scope.locks = {order: undefined};


                $scope.locks.order = ngivrLock({
                    scope: $scope,
                    watchId: 'order._id',
                    schema: 'order',
                    watchEditing: 'edited.order',
                    scopeDecorator: {
                        onAutoUnlockOrError: {
                            cancelFunction: async () => await $scope.cancelOrder({timeout: true, idx: $scope.idx})
                        },
                        lock: {
                            functionName: ['editOrder', 'lockOrder'],
                        },
                        unlock: {
                            functionName: ['saveOrder', 'cancelOrder', 'unlockOrder'],
                        }
                    }
                });


                let ngivrDataIds = {
                    loadLocation: {dataId: undefined, schema: 'site'},
                    unloadLocation: {dataId: undefined, schema: 'site'},
                    seller: {dataId: undefined, schema: 'partner'},
                    destination: {dataId: undefined, schema: 'partner'},
                    unloadDepot: {dataId: undefined, schema: 'depot'},
                    orderProduct: {dataId: undefined, schema: 'product'}
                };

                for (let key in ngivrDataIds) {
                    if ($scope.order[key]) {
                        if ($scope.order[key][0]) {
                            ngivrDataIds[key].dataId = ngivrService.data.id({
                                schema: ngivrDataIds[key].schema,
                                model: $scope.order[key][0],
                                $scope: $scope
                            });
                        }

                    }

                }

                $scope.$watch('order.unloadDepot[0]', (newVal, oldVal) => {
                    if (newVal !== null && newVal !== undefined) {
                        if ((newVal && oldVal && newVal._id !== oldVal._id) || (newVal !== oldVal)) {
                            if (ngivrDataIds.unloadDepot.dataId) {
                                ngivrDataIds.unloadDepot.dataId.destroy();
                            }

                            ngivrDataIds.unloadDepot.dataId = ngivrService.data.id({
                                schema: 'depot',
                                model: $scope.order.unloadDepot[0],
                                $scope: $scope
                            });
                        }
                    }

                }, true);

                $scope.$watch('order.loadLocation[0]', (newVal, oldVal) => {
                    if (newVal !== null && newVal !== undefined) {
                        if ((newVal && oldVal && newVal._id !== oldVal._id) || (newVal !== oldVal)) {
                            if (ngivrDataIds.loadLocation.dataId) {
                                ngivrDataIds.loadLocation.dataId.destroy();
                            }

                            ngivrDataIds.loadLocation.dataId = ngivrService.data.id({
                                schema: 'site',
                                model: $scope.order.loadLocation[0],
                                $scope: $scope
                            });
                        }
                    }

                }, true);

                $scope.$watch('order.unloadLocation[0]', (newVal, oldVal) => {
                    if (newVal !== null && newVal !== undefined) {
                        if ((newVal && oldVal && newVal._id !== oldVal._id) || (newVal !== oldVal)) {
                            if (ngivrDataIds.unloadLocation.dataId) {
                                ngivrDataIds.unloadLocation.dataId.destroy();
                            }

                            ngivrDataIds.unloadLocation.dataId = ngivrService.data.id({
                                schema: 'site',
                                model: $scope.order.unloadLocation[0],
                                $scope: $scope
                            });
                        }
                    }

                }, true);

                $scope.$watch('order.seller', (newVal, oldVal) => {
                    if (newVal !== oldVal) {
                        if (ngivrDataIds.seller.dataId) {
                            ngivrDataIds.seller.dataId.destroy();
                        }

                        ngivrDataIds.seller.dataId = ngivrService.data.id({
                            schema: 'partner',
                            model: $scope.order.seller,
                            $scope: $scope
                        });
                    }
                }, true);

                $scope.$watch('order.destination', (newVal, oldVal) => {
                    if (newVal !== oldVal) {
                        if (ngivrDataIds.destination.dataId) {
                            ngivrDataIds.destination.dataId.destroy();
                        }

                        ngivrDataIds.destination.dataId = ngivrService.data.id({
                            schema: 'partner',
                            model: $scope.order.destination,
                            $scope: $scope
                        });
                    }
                }, true);

                // let ngivrDataIdLoadLocation;
                // let ngivrDataIdUnloadLocation;

                // //betöltéskor, ha van fel és lerakóhely, akkor betöltjük az aktuális site objectet és ngivrDataID-val biztosítjuk a frissítést
                // if ($scope.order.loadLocation[0]) {
                //     let resp = await ngivrApi.id('site', $scope.order.loadLocation[0]._id);
                //
                //     if ($scope.order.loadLocation[0].updatedAt !== resp.data.doc.updatedAt) {
                //         $scope.order.loadLocation[0] = resp.data.doc;
                //     } else {
                //         ngivrDataIdLoadLocation = ngivrService.data.id({
                //             schema: 'site',
                //             model: $scope.order.loadLocation[0],
                //             $scope: $scope
                //         });
                //     }
                // }
                //
                // if ($scope.order.unloadLocation[0]) {
                //     let resp = await ngivrApi.id('site', $scope.order.unloadLocation[0]._id);
                //
                //     if ($scope.order.unloadLocation[0].updatedAt !== resp.data.doc.updatedAt) {
                //         $scope.order.unloadLocation[0] = resp.data.doc;
                //     } else {
                //         ngivrDataIdUnloadLocation = ngivrService.data.id({
                //             schema: 'site',
                //             model: $scope.order.unloadLocation[0],
                //             $scope: $scope
                //         });
                //     }
                // }
                //
                //
                // /**
                //  * Ha változik a felrakóhely, akkor új dataID kell
                //  */
                // $scope.$watch('order.loadLocation[0]', (newVal, oldVal) => {
                //     if (newVal !== oldVal) {
                //         if (ngivrDataIdLoadLocation) {
                //             ngivrDataIdLoadLocation.destroy();
                //         }
                //
                //         ngivrDataIdLoadLocation = ngivrService.data.id({
                //             schema: 'site',
                //             model: $scope.order.loadLocation[0],
                //             $scope: $scope
                //         });
                //     }
                // });
                //
                // /**
                //  * Ha változik a lerakóhely, akkor új dataID kell
                //  */
                // $scope.$watch('order.unloadLocation[0]', (newVal, oldVal) => {
                //     if (newVal !== oldVal) {
                //         if (ngivrDataIdUnloadLocation) {
                //             ngivrDataIdUnloadLocation.destroy();
                //         }
                //
                //         ngivrDataIdUnloadLocation = ngivrService.data.id({
                //             schema: 'site',
                //             model: $scope.order.unloadLocation[0],
                //             $scope: $scope
                //         });
                //     }
                // });

                // const ngivrFormLockSubscriber = (locksData) => {
                //     $scope.redisLockList = locksData.locks;
                //     let currentResource;
                //     if ($scope.order) currentResource = 'order:' + $scope.order._id;
                //     let user = Auth.getCurrentUser()._id;
                //     let currentLockData = undefined;
                //     $scope.locked = undefined;
                //     for (let lockData of locksData.locks) {
                //
                //         if (lockData.doc === currentResource) {
                //             $scope.locked = lockData;
                //             if (lockData.user !== user) {
                //                 $scope.locked = lockData;
                //                 break;
                //             }
                //             currentLockData = lockData;
                //             break;
                //         }
                //     }
                //
                //     $timeout(() => $scope.$apply(() => {
                //
                //
                //         if (currentLockData !== undefined && $scope.lock !== undefined) {
                //             $scope.locked = undefined;
                //             let renewExpirationTimeoutCallback = Math.max((currentLockData.timeout - 15) * 1000, 0);
                //             const generateLog = (text) => {
                //                 ngivr.console.group(`NGIVR-FORM:lock `);
                //                 console.log(`${text} resource`, currentLockData.doc, 'by', Auth.getCurrentUser().nickName, 'timeout', currentLockData.timeout, 'renewExpirationTimeoutCallback', renewExpirationTimeoutCallback / 1000 /*, 'on', new Date($scope.lock.expiration), 'ttl', currentLockData.ttl, 'renewExpirationTimeoutCallback', renewExpirationTimeoutCallback , 'lock.expiration', $scope.lock.expiration, 'generatedRenewExpirationTimeoutCallback', generatedRenewExpirationTimeoutCallback, typeof generatedRenewExpirationTimeoutCallback */)
                //                 ngivr.console.group()
                //             };
                //
                //             generateLog('will renew');
                //
                //             const renewTimeoutCallback = () => {
                //                 generateLog('renewing now');
                //                 ngivrLockService.emitRenew({
                //                     resource: currentLockData.doc,
                //                     user: currentLockData.user,
                //                     ttl: currentLockData.ttl,
                //                     id: socket.ioClient.id,
                //                 })
                //             };
                //             $timeout.cancel(ngivrFormLockSubscriber.renewTimeout);
                //             ngivrFormLockSubscriber.renewTimeout = $timeout(renewTimeoutCallback, renewExpirationTimeoutCallback)
                //
                //         } else {
                //             //ngivr.console.group(`NGIVR-FORM:lock ${formLog()}`)
                //             console.log('renewing disabled, not editing')
                //             ngivr.console.group();
                //             $timeout.cancel(ngivrFormLockSubscriber.renewTimeout);
                //         }
                //         if (currentLockData === undefined && $scope.lock !== undefined) {
                //             $scope.lock = undefined
                //             // self.close(true);
                //         }
                //     }));
                // };
                //
                //
                // ngivrFormLockSubscriber.id = 'order_' + thisFormIndex;
                //
                // ngivrLockService.subscribe(ngivrFormLockSubscriber);

                let ngivrDataId;

                $scope.createDatId = () => {
                    ngivrDataId = ngivrService.data.id({
                        schema: 'order',
                        model: $scope.order,
                        $scope: $scope,
                        subscribe: async (promise) => {
                            try {
                                const response = await promise;
                                if (response._id === $scope.order._id)
                                    Object.assign($scope.order, response, {edited: false});
                                await $scope.getLastTicketDate();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    });
                };

                /**
                 * ngivrDataId-val biztosítjuk az order frissíését
                 */
                //if (!$scope.isInList) {
                if ($scope.order._id) {
                    $scope.createDatId()
                }
                //}

                $scope.$on('$destroy', async () => {
                    for (let key in ngivrDataIds) {
                        if (ngivrDataIds[key].dataId) {
                            ngivrDataIds[key].dataId.destroy()
                        }

                    }
                    // if (ngivrDataIdLoadLocation) {
                    //     ngivrDataIdLoadLocation.destroy();
                    // }
                    // if (ngivrDataIdUnloadLocation) {
                    //     ngivrDataIdUnloadLocation.destroy();
                    // }
                    // await ngivrLockService.unlockMore();
                    // ngivrLockService.unsubscribe(ngivrFormLockSubscriber);
                    socket.socket.removeListener('depot:reservation', reservationListener);
                    socket.socket.removeListener('depot:save', reservationListener)
                });

                /**
                 * listener függvény raktár változására
                 * @param o
                 * @returns {Promise<void>}
                 */
                const reservationListener = async (o) => {
                    if ($scope.order.loadLocation && $scope.order.loadLocation.length && $scope.order.loadLocation[0] !== null && $scope.order.loadLocation[0]._id === o.site[0]._id) {
                        await $scope.setDepotsWithProduct($scope.order.loadLocation[0])
                    }

                };

                socket.socket.on('depot:reservation', reservationListener);

                socket.socket.on('depot:save', reservationListener);

                $scope.availableMode = {
                    pbt: 'pbt', //partner betárolás tárházba
                    sht: 'sht', //sygnus hajó rakodás tárházból
                    pkt: 'pkt', //partner kitárolás tárházból
                    pht: 'pht', //partner hajórakodás tárházból
                    pkb: 'pkb', //partner külső beszállítás hajóba
                    int: 'int', //belső áttárolás

                    ekh: 'ekh', //egyenes kiszállítás hajóból ömlesztve: EKH
                    bto: 'bto', //betárolás tárházba ömlesztve: BTO
                    ekz: 'ekz', //egyenes kiszállítás zsákban: EKZ
                };
                $scope.mode = null;
                $scope.defaultOrder = {
                    edit: false,
                    unloadLocation: [],
                    unloadDepot: [],
                    orderProduct: [],
                    loadLocation: [],
                    partner: [],
                    loadLocationSettlement: [],
                    partnerPartner: [],
                    carrier: []
                };
                $scope.defaultVehicleData = {
                    weightToTransfer: null,
                    weightPerVehicle: null,
                    loadDate: null,
                    plateNumber1: null,
                    country1: null,
                    plateNumber2: null,
                    country2: null,
                    arrivalDate: null,
                    numberOfVehicles: 1,
                    carrier: null,
                };
                $scope.listQuery = {
                    vehicle: {
                        // 'sort': {'updatedAt': -1},
                        'search': {
                            deleted: false,
                            orderId: $scope.order._id === undefined ? null : $scope.order._id,
                            tcnStatus: {$ne: 'I'}
                        }
                    }
                };

                const alertModification = () => {
                    alert(`Módosultak a ${$scope.order.orderNumber ? $scope.order.orderNumber : ''}${$scope.order.orderNumber ? ' számú' : ''} diszpozíció terményének paraméter beállításai! Kérem ellenőrizze a mérlegben kötelezően kitöldendő paramétereket!`);
                };

                const compareProductParameters = () => {
                    let tmpParams = $scope.order.orderProduct[0].qualityParams.filter((o) => {
                        return o.libra
                    });
                    let changed = false;
                    for (let param of tmpParams) {
                        let idx = Common.functiontofindIndexByKeyValue($scope.order.productParams, '_id', param._id);
                        if (idx === null) {
                            $scope.order.productParams.push(angular.copy(param));
                            if (!changed) {
                                changed = true
                            }
                        }
                    }
                    for (let i = $scope.order.productParams.length - 1; i >= 0; i--) {
                        let idx = Common.functiontofindIndexByKeyValue(tmpParams, '_id', $scope.order.productParams[i]._id);
                        if (idx === null) {
                            $scope.order.productParams.splice(i, 1);
                            if (!changed) {
                                changed = true
                            }

                        }

                    }
                    if (changed && $scope.order._id) {
                        alertModification()
                    }
                    console.warn($scope.order.productParams)
                };

                $scope.$watch('order.orderProduct[0]', function (newVal, oldVal) {

                    let needAlert = true;
                    if (newVal !== null && newVal !== undefined) {
                        if ($scope.order.productParams) {
                            compareProductParameters();
                            needAlert = false
                        }

                        if ((newVal && oldVal && newVal._id !== oldVal._id) || (newVal !== oldVal)) {
                            if (ngivrDataIds.orderProduct.dataId) {
                                ngivrDataIds.orderProduct.dataId.destroy();
                            }

                            ngivrDataIds.orderProduct.dataId = ngivrService.data.id({
                                schema: 'product',
                                model: $scope.order.orderProduct[0],
                                $scope: $scope
                            });
                        }
                    }
                    if ($scope.origOrder && $scope.origOrder.orderProduct && angular.equals($scope.origOrder.orderProduct[0], newVal)) {
                        if (newVal === undefined) {
                            $scope.order.productParams = undefined
                        }
                        return;
                    }
                    $timeout(async function () {
                        if (newVal && newVal.qualityParams && newVal.qualityParams.length) {
                            if (oldVal === undefined || oldVal === null || newVal._id !== oldVal._id) {
                                $scope.setProductParameters(newVal.qualityParams);
                            } else if (!angular.equals(newVal.qualityParams, oldVal.qualityParams)) {
                                if (needAlert) {
                                    alertModification()
                                }
                                let tmpParams = newVal.qualityParams.filter((o) => {
                                    return o.libra
                                });
                                for (let param of tmpParams) {
                                    let idx = Common.functiontofindIndexByKeyValue($scope.order.productParams, '_id', param._id);
                                    if (idx === null) {
                                        $scope.order.productParams.push(angular.copy(param))
                                    }
                                }
                                for (let i = $scope.order.productParams.length - 1; i >= 0; i--) {
                                    let idx = Common.functiontofindIndexByKeyValue(tmpParams, '_id', $scope.order.productParams[i]._id);
                                    if (idx === null) {
                                        $scope.order.productParams.splice(i, 1)
                                    }

                                }

                                console.warn($scope.order.productParams)
                            }
                        } else {
                            $scope.order.productParams = undefined
                        }
                        await $scope.setDepotsWithProduct($scope.order.loadLocation[0])
                        //$scope.getDepots($scope.order.loadLocation[0]);
                    });
                }, true);

                $scope.$watch('order.partner[0]', function (partner) {
                    if ($scope.origOrder && $scope.origOrder.partner && angular.equals($scope.origOrder.partner[0], partner)) {
                        return;
                    }
                    $timeout(async function () {
                        await $scope.setDepotsWithProduct($scope.order.loadLocation[0])
                        //$scope.getDepots($scope.order.loadLocation[0]);
                    });
                });

                $scope.$watch('order.selectedSourceServiceContract', function (selectedSourceServiceContract) {
                    if ($scope.origOrder && $scope.origOrder.selectedSourceServiceContract && angular.equals($scope.origOrder.selectedSourceServiceContract, selectedSourceServiceContract)) {
                        return;
                    }
                    $timeout(async function () {
                        await $scope.setDepotsWithProduct($scope.order.loadLocation[0])
                        //$scope.getDepots($scope.order.loadLocation[0]);
                    });
                });


                $scope.$watch('order.loadLocation[0]', function (loadLocation) {
                    // if ($scope.origOrder.loadLocation && angular.equals($scope.origOrder.loadLocation[0], loadLocation)) {
                    //     return;
                    // }
                    if ($scope.loadPlace) {
                        if ($scope.order.direction !== 'external_in' && loadLocation && $scope.loadPlace && $scope.loadPlace._id !== loadLocation._id) {
                            $scope.order.direction = 'internal';
                            $scope.order.intShip = true;
                            if ($scope.order.sygnus) {
                                $scope.order.partnerRelation = 1; // sygnus-sygnus;
                                //$scope.order.cardType = "order";
                                $scope.sygnus_sygnus($scope.order);
                                $scope.setPartnerAsSygnus();
                            } else {
                                $scope.order.partnerRelation = 2;
                                $scope.partner_sygnus($scope.order)
                            }

                        } else {
                            //$scope.order.direction = 'out';
                            //$scope.order.intShip = false
                        }
                    }

                    if ($scope.mode === $scope.availableMode.int || $scope.mode === $scope.availableMode.sht || $scope.mode === $scope.availableMode.pkt || $scope.mode === $scope.availableMode.pht) {
                        $timeout(async function () {
                            // the code you want to run in the next digest
                            if (loadLocation) {
                                await $scope.setDepotsWithProduct(loadLocation);
                                $scope.checkIsITK();
                            } else {
                                $scope.order.depotsWithProduct = []
                            }
                        });
                    }
                });

                $scope.$watch('order.shipItem', function (newVal) {

                    if (newVal === undefined) {
                        return;
                    }

                    if (angular.equals(newVal._id, $scope.origOrder.shipItemId)) {
                        return;
                    }

                    $timeout(async function () {

                        let ship = await ngivrApi.id('ship', $scope.order.ship._id);

                        for (let k in ship.data.doc.items) {
                            if (newVal._id === ship.data.doc.items[k]._id) {

                                if (ship.data.doc.items[k].stripping === ngivr.settings.strippingType.sack) {

                                    $scope.order.partner = [];
                                    $scope.order.partnerToolkit = [];
                                    $scope.order.partnerTool = [];

                                    $scope.order.partner[0] = ship.data.doc.items[k].partner[0];
                                    $scope.order.partnerToolkit[0] = ship.data.doc.items[k].partnerToolkit[0];
                                    $scope.order.partnerTool[0] = ship.data.doc.items[k].partnerTool[0];

                                    $scope.order.sackDb = ship.data.doc.items[k].sackDb;
                                }

                            }
                        }

                    });
                });

                $scope.setPartnerAsSygnus = function () {
                    $scope.order.partner = [$scope.ownFirm];
                };

                $scope.sygnus_sygnus = function (dispo) //Sygnus-Sygnus szállítás
                {
                    dispo.seller = $scope.ownFirm;
                    dispo.ekaerSellerVat = ngivr.settings.ownFirm.vatNumberHU;
                    dispo.destination = $scope.ownFirm;
                    dispo.ekaerDestinationVat = ngivr.settings.ownFirm.vatNumberHU

                };


                /**
                 * EKÁER Sygnus-partner
                 * @param dispo
                 */
                $scope.partner_sygnus = function (dispo) //Sygnus-Sygnus szállítás
                {

                    ngivrService.api.id('partner', ngivr.settings.ownFirm._id).then(function (response) {
                        const firm = response.data.doc; //sygnus
                        if (dispo.sygnus) {
                            dispo.seller = undefined;
                            dispo.ekaerDestinationVat = ngivr.settings.ownFirm.vatNumberHU;
                            dispo.destination = firm;
                            dispo.isIntermodal = false
                        } else {
                            if (mode === $scope.availableMode.sht && dispo.intShip && !$scope.parentFormName) {
                                dispo.seller = firm;
                                dispo.ekaerSellerVat = ngivr.settings.ownFirm.vatNumberHU;
                                dispo.destination = dispo.partner[0];
                                dispo.isIntermodal = true
                            }

                        }
                    })

                };

                $scope.setEKAER = () => {
                    if ($scope.order.sygnus) {

                    } else {
                        if ($scope.order.ekaer) {
                            $scope.partner_sygnus($scope.order);
                            $scope.order.partnerRelation = 2
                        }
                    }
                };

                /**
                 * Új order hozzáadása
                 * @param {boolean} sygnus
                 */
                $scope.addOrder = async function (sygnus) { //TODO ha nem sygnus áttárolás, akkor a partner az áru tulasjdonosa

                    if ($scope.currentUser.site) {
                        if ($scope.order.direction === 'in') {
                            $scope.order.unloadLocation[0] = $scope.currentUser.site
                        } else if ($scope.order.direction === 'out') {
                            $scope.order.loadLocation[0] = $scope.currentUser.site
                        }
                    }

                    if (sygnus !== undefined) {
                        $scope.order.sygnus = sygnus;
                    }

                    $scope.edited.order = true;

                    if ($scope.mode === $scope.availableMode.pht || $scope.mode === $scope.availableMode.sht) {
                        await $scope.setLoadLocation();
                    }
                    if ($scope.mode === $scope.availableMode.pkt) {
                        $scope.order.allowedPlateNumbers = []
                    }

                    if ($scope.order.sygnus) {
                        $scope.order.partnerRelation = 1; // sygnus-sygnus;
                        //$scope.order.cardType = "order";
                        $scope.sygnus_sygnus($scope.order);
                        $scope.setPartnerAsSygnus();
                    }

                };

                if (!$scope.order._id) {
                    await $scope.addOrder($scope.order.sygnus)
                }

                $scope.subscribe('reservationCleared', async (options) => {
                    if ($scope.order._id === options.orderId) {
                        $http.put('/api/orders/' + $scope.order._id, $scope.order)
                    }
                });

                /**
                 * order mentése
                 * @param order
                 * @param mode
                 * @returns {Promise<void>}
                 */
                $scope.saveOrder = async (order, mode) => {

                    if ($scope.initOrder) {
                        $scope.initOrder.mode = mode;
                    }
                    order.orderProductId = order.orderProduct[0]._id; //termény ID
                    order.orderProductName = order.orderProduct[0].name; //termény név

                    if (order.depotsWithProduct && order.depotsWithProduct.length) {
                        order.volume = 0;
                        if (!order.loadDepot) {
                            order.loadDepot = [];
                        }

                        for (let depot of order.depotsWithProduct) {
                            if (depot.quantity) {
                                order.volume += depot.quantity;
                                let idx = Common.functiontofindIndexByKeyValue(order.loadDepot, 'depot', depot._id.depotId);
                                if (idx !== null) {
                                    order.loadDepot[idx].quantity = depot.quantity;
                                } else {
                                    order.loadDepot.push({
                                        depot: depot._id.depotId,
                                        quantity: depot.quantity,
                                        product: depot._id.productId,
                                        performed: 0
                                    })
                                }

                            }
                        }
                    }

                    switch (mode) {
                        case $scope.availableMode.pbt:
                            await SavePBT();
                            break;
                        case $scope.availableMode.sht:
                            await SaveSHT();
                            break;
                        case $scope.availableMode.pht:
                            await SavePHT();
                            break;
                        case $scope.availableMode.pkt:
                            await SavePKT();
                            break;
                        case $scope.availableMode.pkb:
                            await SavePKB();
                            break;
                        case $scope.availableMode.int:
                            await SaveINT();
                            break;
                        case $scope.availableMode.ekh:
                            await SaveEKH();
                            break;
                        case $scope.availableMode.ekz:
                            await SaveEKZ();
                            break;
                        case $scope.availableMode.bto:
                            await SaveBTO();
                            break;
                    }

                    if ($scope.order.volume) {
                        $scope.order.volume = Number($scope.order.volume.toFixed(3));
                    }
                    else {
                        $scope.order.volume = 0;
                    }
                    if ($scope.order.orderNumber && !$scope.fileName) {
                        $scope.fileName = ($scope.order.orderNumber.replace(/\s|\./g, '_') + ngivr.strings.fileName.orderTicketList) + '.xlsx'
                    }


                    async function SaveSHT() {

                        if ($scope.order.depotsWithProduct.length > 0) {
                            let hasValue = false;
                            for (let i in $scope.order.depotsWithProduct) {
                                if ($scope.order.depotsWithProduct[i].quantity != null || $scope.order.depotsWithProduct[i].quantity !== undefined) {
                                    hasValue = true;
                                }
                            }

                            if (!hasValue) {
                                ngivrGrowl('Kérem adjon meg legalább 1 raktárban mennyiséget.');
                                return;
                            }
                        }

                        //$scope.publish('ngivrOrderNewRemove', $scope.initOrder);

                        if (!$scope.order.hasOwnProperty('_id')) {
                            $scope.order.name = await $scope.setNumber(`SHT${ngivr.settings.plusPrefix}`);
                            $scope.order.orderNumber = $scope.order.name;
                            $scope.order.mode = $scope.mode;
                            $scope.order.needContract = true;
                            $scope.order.finalized = true;
                            $scope.order.performed = 0;
                            // if ($scope.loadPlace._id === $scope.order.loadLocation[0]._id) {
                            $scope.order.shipOnType = ngivrSettings.shipOnType.sht;
                            $scope.order.createdByOrderWonder = true;

                            if ($scope.loadPlace._id !== $scope.order.loadLocation[0]._id) {
                                $scope.order.intShip = true;
                                //létrehozunk egy afk order-t (áttárolás forrású kitárolás
                                let afk = {
                                    orderNumber: $scope.order.orderNumber + '/AFK',
                                    volume: $scope.order.volume,
                                    finalizedQuantity: 0,
                                    performed: 0,
                                    direction: 'out',
                                    cargoPlanId: $scope.order.cargoPlanId,
                                    cargoPlanName: $scope.order.cargoPlanName,
                                    edit: false,
                                    afkd: true,
                                    needContract: true,
                                    finalized: true,
                                    sygnus: true
                                };
                                let resp = await ngivrHttp.post('/api/orders', afk);
                                $scope.order.parentOrderId = resp.data._id;
                                $scope.order.parentOrderNumber = resp.data.orderNumber;
                            } else {
                                $scope.order.ownPlateNumbersAllowed = true
                            }
                            let resp = await ngivrHttp.post('/api/orders/', $scope.order);
                            $scope.order._id = resp.data._id;
                            $scope.edited.order = false;
                            $scope.createDatId()
                        }
                        else {
                            // await ngivrLockService.unlock('order:' + $scope.order._id);
                            //$scope.setLock({order: $scope.order, lock: false}); //ordelock oldás
                            // if ($scope.loadPlace._id === $scope.order.loadLocation[0]._id) {
                            // $scope.order.shipOnType = ngivrSettings.shipOnType.sht;
                            // if ($scope.loadPlace._id !== $scope.order.loadLocation[0]._id) {
                            //     $scope.order.intShip = true
                            // }
                            // } else {
                            //     $scope.order.shipOnType = ngivrSettings.shipOnType.intShip;
                            //$scope.order.direction = 'internal'
                            //  }
                            delete $scope.order.__v;
                            $http.put('/api/orders/' + $scope.order._id, $scope.order).then(function () {
                                $scope.edited.order = false;
                                $scope.origOrder = angular.copy($scope.order);
                            });
                        }
                    }

                    async function SavePHT() {

                        if ($scope.order.depotsWithProduct.length > 0) {
                            let hasValue = false;
                            for (let i in $scope.order.depotsWithProduct) {
                                if ($scope.order.depotsWithProduct[i].quantity != null || $scope.order.depotsWithProduct[i].quantity !== undefined) {
                                    hasValue = true;
                                }
                            }

                            if (!hasValue) {
                                ngivrGrowl('Kérem adjon meg legalább 1 raktárban mennyiséget.');
                                return;
                            }
                        }

                        $scope.order.actualServiceContract = $scope.order.selectedActualServiceContract._id;
                        $scope.order.sourceServiceContractId = $scope.order.selectedSourceServiceContract._id;

                        //$scope.publish('ngivrOrderNewRemove', $scope.initOrder);

                        if (!$scope.order.hasOwnProperty('_id')) {
                            $scope.order.name = await $scope.setNumber(`PHT${ngivr.settings.plusPrefix}`);
                            $scope.order.orderNumber = $scope.order.name;
                            $scope.order.needContract = true;
                            $scope.order.finalized = true;
                            $scope.order.mode = $scope.mode;
                            //$scope.order.volume = 0;
                            $scope.order.performed = 0;
                            $scope.order.shipOnType = ngivrSettings.shipOnType.pht;
                            $scope.order.createdByOrderWonder = true;

                            if ($scope.loadPlace._id !== $scope.order.loadLocation[0]._id) {
                                $scope.order.intShip = true
                                //létrehozunk egy afk order-t (áttárolás forrású kitárolás
                                let afk = {
                                    orderNumber: $scope.order.orderNumber + '/AFK',
                                    volume: $scope.order.volume,
                                    finalizedQuantity: 0,
                                    performed: 0,
                                    direction: 'out',
                                    cargoPlanId: $scope.order.cargoPlanId,
                                    cargoPlanName: $scope.order.cargoPlanName,
                                    edit: false,
                                    afkd: true,
                                    needContract: true,
                                    finalized: true,
                                    sygnus: false,
                                    partner: $scope.order.partner
                                };
                                let resp = await ngivrHttp.post('/api/orders', afk);
                                $scope.order.parentOrderId = resp.data._id;
                                $scope.order.parentOrderNumber = resp.data.orderNumber;
                            }
                            let resp = await ngivrHttp.post('/api/orders/', $scope.order);
                            $scope.order._id = resp.data._id;
                            $scope.edited.order = false;
                            $scope.createDatId()
                        }
                        else {
                            // await ngivrLockService.unlock('order:' + $scope.order._id);
                            //$scope.setLock({order: $scope.order, lock: false}); //orderlock oldás
                            $scope.order.shipOnType = ngivrSettings.shipOnType.pht;
                            $http.put('/api/orders/' + $scope.order._id, $scope.order).then(function () {
                                $scope.edited.order = false;
                            });
                        }
                    }

                    async function SavePBT() {

                        $scope.publish('ngivrOrderNewRemove', $scope.initOrder);
                        $scope.order.actualServiceContract = $scope.order.selectedActualServiceContract._id;
                        $scope.order.ownPlateNumbersAllowed = true;

                        if (!$scope.order.hasOwnProperty('_id')) {
                            $scope.order.name = await $scope.setNumber(`PBT${ngivr.settings.plusPrefix}`);
                            $scope.order.orderNumber = $scope.order.name;
                            $scope.order.needContract = true;
                            $scope.order.finalized = true;
                            $scope.order.shipOnType = ngivrSettings.shipOnType.pbt;
                            $scope.order.createdByOrderWonder = true;
                            $http.post('/api/orders/', $scope.order).then(function (response) {
                                $scope.edited.order = false;

                                $timeout(() => {
                                    $scope.order._id = response.data._id;

                                    $scope.createDatId()
                                    //$scope.order = response.data;
                                    if (!$scope.isInList) {
                                        if ($scope.order._id) {
                                            ngivrDataId = ngivrService.data.id({
                                                schema: 'order',
                                                model: $scope.order,
                                                $scope: $scope,
                                            });
                                        }
                                    }
                                    $scope.tab.title = $scope.order.orderNumber;
                                    ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                                        $scope.order.selectedActualServiceContract = response.data.doc;
                                    });
                                    //$scope.locks.order.unlock();
                                }, ngivr.settings.debounce);

                            });
                        }
                        else {
                            // await ngivrLockService.unlock('order:' + $scope.order._id);
                            //$scope.setLock({order: $scope.order, lock: false}); //orderlock oldás
                            $scope.order.shipOnType = ngivrSettings.shipOnType.pbt;
                            $http.put('/api/orders/' + $scope.order._id, $scope.order).then(function (response) {
                                //$scope.order = response.data;
                                ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                                    $scope.order.selectedActualServiceContract = response.data.doc;
                                    $scope.origOrder = angular.copy($scope.order);
                                    $scope.edited.order = false;
                                    $scope.publish('ngivrOrderSaved', $scope.order);
                                });
                            });
                        }
                    }

                    async function SavePKT() {

                        // if ($scope.order.depotsWithProduct.length > 0) {
                        //     let hasValue = false;
                        //     for (let i in $scope.order.depotsWithProduct) {
                        //         if ($scope.order.depotsWithProduct[i].quantity != null || $scope.order.depotsWithProduct[i].quantity !== undefined) {
                        //             hasValue = true;
                        //         }
                        //     }
                        //
                        //     if (!hasValue) {
                        //         ngivrGrowl('Kérem adjon meg legalább 1 raktárban mennyiséget.');
                        //         return;
                        //     }
                        // }
                        if (!$scope.isValueInDepotsWithProduct()) return;

                        $scope.publish('ngivrOrderNewRemove', $scope.initOrder);

                        $scope.order.actualServiceContract = $scope.order.selectedActualServiceContract._id;
                        $scope.order.sourceServiceContractId = $scope.order.selectedSourceServiceContract._id;

                        if (!$scope.order.hasOwnProperty('_id')) {
                            $scope.order.name = await $scope.setNumber(`PKT${ngivr.settings.plusPrefix}`);
                            $scope.order.orderNumber = $scope.order.name;
                            $scope.order.needContract = true;
                            $scope.order.finalized = true;
                            $scope.order.shipOnType = ngivrSettings.shipOnType.pkt;
                            $scope.order.createdByOrderWonder = true;
                            //$scope.order.allowedPlateNumbers = $scope.order.allowedPlateNumbersChips;
                            $http.post('/api/orders/', $scope.order).then(async function (response) {
                                $scope.order = response.data;
                                $scope.createDatId()
                                $scope.tab.title = $scope.order.orderNumber;
                                //$scope.order._id = response.data._id;
                                $scope.edited.order = false;
                                if (!$scope.isInList) {
                                    if ($scope.order._id) {
                                        ngivrDataId = ngivrService.data.id({
                                            schema: 'order',
                                            model: $scope.order,
                                            $scope: $scope,
                                        });
                                    }
                                }
                                // $scope.saveDepots().then(function () {
                                $scope.publish('ngivrOrderSaved', $scope.order);
                                // $scope.loadDepots();
                                if ($scope.order.loadDepot && $scope.order.loadDepot.length) {
                                    for (let i in $scope.order.loadDepot) {
                                        let resp = await ngivrApi.id('depot', $scope.order.loadDepot[i].depot);
                                        $scope.order.loadDepot[i].depotName = resp.data.doc.name
                                    }
                                }
                                ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                                    $scope.order.selectedActualServiceContract = response.data.doc;
                                    $scope.origOrder = angular.copy($scope.order);
                                    $scope.edited.order = false;
                                    $scope.publish('ngivrOrderSaved', $scope.order);
                                });
                                ngivrApi.id('serviceContract', $scope.order.sourceServiceContractId).then(function (response) {
                                    $scope.order.selectedSourceServiceContract = response.data.doc;
                                });
                                $timeout(() => {
                                    $scope.locks.order.unlock();
                                }, ngivr.settings.debounce);
                                // })
                            });
                            // })
                        }
                        else {
                            // await ngivrLockService.unlock('order:' + $scope.order._id);
                            //$scope.setLock({order: $scope.order, lock: false}); //orderlock oldás
                            delete $scope.order.__v;
                            $scope.order.shipOnType = ngivrSettings.shipOnType.pkt;
                            //$scope.order.allowedPlateNumbers = $scope.order.allowedPlateNumbersChips;
                            $http.put('/api/orders/' + $scope.order._id, $scope.order).then(async function () {
                                $scope.edited.order = false;
                                //$scope.saveDepots().then(function () {
                                $scope.publish('ngivrOrderSaved', $scope.order);
                                // $scope.loadDepots();
                                // if ($scope.order.loadDepot && $scope.order.loadDepot.length) {
                                //     for (let i in $scope.order.loadDepot) {
                                //         let resp = await ngivrApi.id('depot', depot.depot);
                                //         $scope.order.loadDepot[i].depotName = resp.data.doc.name
                                //     }
                                // }
                                ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                                    $scope.order.selectedActualServiceContract = response.data.doc;
                                    $scope.origOrder = angular.copy($scope.order);
                                    $scope.edited.order = false;
                                    $scope.publish('ngivrOrderSaved', $scope.order);
                                });
                                ngivrApi.id('serviceContract', $scope.order.sourceServiceContractId).then(function (response) {
                                    $scope.order.selectedSourceServiceContract = response.data.doc;
                                });
                                // })
                            });
                        }
                    }

                    /**
                     * Partner külső beszállítás mentése
                     * @returns {Promise<void>}
                     * @constructor
                     */
                    async function SavePKB() {

                        // $scope.publish('ngivrOrderNewRemove', $scope.initOrder);
                        $scope.order.actualServiceContract = $scope.order.selectedActualServiceContract._id;
                        $scope.order.ownPlateNumbersAllowed = true;

                        if (!$scope.order.hasOwnProperty('_id')) {

                            //$http.get('/api/counters/PKB').then(function (number) { //új dispohoz kérünk sorszámot, majd mentjük
                            $scope.order.name = await $scope.setNumber(`PKB${ngivr.settings.plusPrefix}`);
                            $scope.order.orderNumber = $scope.order.name;
                            $scope.order.mode = $scope.mode;
                            $scope.order.performed = 0;
                            $scope.order.shipLoading = true;
                            $scope.order.finalized = true;
                            $scope.order.shipOnType = ngivrSettings.shipOnType.pkb;
                            $scope.order.createdByOrderWonder = true;
                            $scope.order.unloadLocation[0] = $scope.loadPlace;
                            $http.post('/api/orders/', $scope.order).then(function (response) {
                                $scope.edited.order = false;
                                $scope.order = response.data;
                                $scope.createDatId()
                            });
                        }
                        else {
                            // await ngivrLockService.unlock('order:' + $scope.order._id);
                            //$scope.setLock({order: $scope.order, lock: false}); // orderlock oldás
                            $scope.order.shipOnType = ngivrSettings.shipOnType.pkb;
                            $scope.order.unloadLocation[0] = $scope.loadPlace;
                            $http.put('/api/orders/' + $scope.order._id, $scope.order).then(function (response) {
                                $scope.order = response.data;
                                ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                                    $scope.order.selectedActualServiceContract = response.data.doc;
                                    $scope.origOrder = angular.copy($scope.order);
                                    $scope.edited.order = false;
                                    $scope.publish('ngivrOrderSaved', $scope.order);
                                });
                            });
                        }
                    }

                    async function SaveINT() {

                        if ($scope.order.depotsWithProduct.length > 0) {
                            let hasValue = false;
                            for (let i in $scope.order.depotsWithProduct) {
                                if ($scope.order.depotsWithProduct[i].quantity != null || $scope.order.depotsWithProduct[i].quantity !== undefined) {
                                    hasValue = true;
                                }
                            }

                            if (!hasValue) {
                                ngivrGrowl('Kérem adjon meg legalább 1 raktárban mennyiséget.');
                                return;
                            }
                        }

                        if ($scope.order.sygnus === false) {
                            $scope.order.actualServiceContract = $scope.order.selectedActualServiceContract._id;
                            $scope.order.sourceServiceContractId = $scope.order.selectedSourceServiceContract._id;
                        }

                        $scope.publish('ngivrOrderNewRemove', $scope.initOrder);

                        async function saveINT() {
                            $scope.order.needContract = true;
                            $scope.order.finalized = true;
                            $scope.order.volume = 0;
                            $scope.order.performed = 0;
                            $scope.order.shipOnType = ngivrSettings.shipOnType.int;
                            $scope.order.createdByOrderWonder = true;
                            $http.post('/api/orders/', $scope.order).then(function (response) {
                                $scope.edited.order = false;
                                $scope.order._id = response.data._id;
                                $scope.listQuery.vehicle.search.orderId = $scope.order._id;
                                $scope.filterRequery();
                                $scope.createDatId()
                                $scope.tab.title = $scope.order.orderNumber;

                                if (!$scope.isInList) {
                                    if ($scope.order._id) {
                                        ngivrDataId = ngivrService.data.id({
                                            schema: 'order',
                                            model: $scope.order,
                                            $scope: $scope,
                                        });
                                    }
                                }

                                $scope.saveDepots().then(function () {
                                    $scope.publish('ngivrOrderSaved', $scope.order);
                                    // $scope.loadDepots();
                                    if ($scope.order.actualServiceContract) {
                                        ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                                            $scope.order.selectedActualServiceContract = response.data.doc;
                                            $scope.origOrder = angular.copy($scope.order);
                                            $scope.edited.order = false;
                                            $scope.publish('ngivrOrderSaved', $scope.order);
                                        });
                                        ngivrApi.id('serviceContract', $scope.order.sourceServiceContractId).then(function (response) {
                                            $scope.order.selectedSourceServiceContract = response.data.doc;
                                        });
                                    }
                                    if ($scope.order.cargoPlanId) {
                                        $scope.getDispoList($scope.order.cargoPlanId);
                                    }
                                })
                            });
                        }

                        if (!$scope.order.hasOwnProperty('_id')) {
                            if ($scope.order.sygnus) {
                                $scope.order.name = await $scope.setNumber(`BAS${ngivr.settings.plusPrefix}`);
                                $scope.order.orderNumber = $scope.order.name;
                                await saveINT();
                            }
                            else {
                                $scope.order.name = await $scope.setNumber(`BAP${ngivr.settings.plusPrefix}`);
                                $scope.order.orderNumber = $scope.order.name;
                                await saveINT();
                            }
                            $timeout(() => {
                                $scope.locks.order.unlock();
                            }, ngivr.settings.debounce * 4);

                        }
                        else {
                            // await ngivrLockService.unlock('order:' + $scope.order._id);
                            delete $scope.order.__v;
                            $scope.order.shipOnType = ngivrSettings.shipOnType.int;
                            $http.put('/api/orders/' + $scope.order._id, $scope.order).then(function () {
                                $scope.edited.order = false;
                                $scope.saveDepots().then(function () {
                                    $scope.publish('ngivrOrderSaved', $scope.order);
                                    // $scope.loadDepots();
                                    if ($scope.order.actualServiceContract) {
                                        ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                                            $scope.order.selectedActualServiceContract = response.data.doc;
                                            $scope.origOrder = angular.copy($scope.order);
                                            $scope.edited.order = false;
                                            $scope.publish('ngivrOrderSaved', $scope.order);
                                        });
                                        ngivrApi.id('serviceContract', $scope.order.sourceServiceContractId).then(function (response) {
                                            $scope.order.selectedSourceServiceContract = response.data.doc;
                                        });
                                    }
                                    if ($scope.order.cargoPlanId) {
                                        $scope.getDispoList($scope.order.cargoPlanId);
                                    }
                                })
                            });
                        }
                    }

                    async function SaveEKH() {

                        $scope.publish('ngivrOrderNewRemove', $scope.initOrder);

                        $scope.order.serviceTypes[0].serviceContractId = $scope.order.selectedActualServiceContract._id;
                        $scope.order.shipId = $scope.order.ship._id;
                        $scope.order.shipName = $scope.order.ship.name;
                        $scope.order.shipItemId = $scope.order.shipItem._id;

                        if (!$scope.order.hasOwnProperty('_id')) {
                            $scope.order.name = await $scope.setNumber(`EKH${ngivr.settings.plusPrefix}`);
                            $scope.order.orderNumber = $scope.order.name;
                            $scope.order.needContract = true;
                            $scope.order.finalized = true;
                            $scope.order.shipOutType = ngivrSettings.shipOutType.ekh;
                            $scope.order.createdByOrderWonder = true;
                            $http.post('/api/orders/', $scope.order).then(function (response) {
                                $scope.order._id = response.data._id;
                                $scope.edited.order = false;
                                ngivrApi.id('serviceContract', $scope.order.serviceTypes[0].serviceContractId).then(function (response) {
                                    $scope.order.selectedActualServiceContract = response.data.doc;
                                    $scope.origOrder = angular.copy($scope.order);
                                    $scope.edited.order = false;
                                    $scope.publish('ngivrOrderSaved', $scope.order);
                                });
                            });
                            // })
                        }
                        else {
                            // await ngivrLockService.unlock('order:' + $scope.order._id);
                            delete $scope.order.__v;
                            $scope.order.shipOutType = ngivrSettings.shipOutType.ekh;
                            $http.put('/api/orders/' + $scope.order._id, $scope.order).then(function () {
                                $scope.edited.order = false;
                                $scope.publish('ngivrOrderSaved', $scope.order);
                                ngivrApi.id('serviceContract', $scope.order.serviceTypes[0].serviceContractId).then(function (response) {
                                    $scope.order.selectedActualServiceContract = response.data.doc;
                                    $scope.origOrder = angular.copy($scope.order);
                                    $scope.edited.order = false;
                                    $scope.publish('ngivrOrderSaved', $scope.order);
                                });
                            });
                        }
                    }

                    async function SaveEKZ() {

                        $scope.publish('ngivrOrderNewRemove', $scope.initOrder);

                        $scope.order.serviceTypes[0].serviceContractId = $scope.order.selectedActualServiceContract[0]._id;
                        $scope.order.serviceTypes[1].serviceContractId = $scope.order.selectedActualServiceContract[1]._id;
                        $scope.order.serviceTypes[2].serviceContractId = $scope.order.selectedActualServiceContract[2]._id;
                        $scope.order.shipId = $scope.order.ship._id;
                        $scope.order.shipName = $scope.order.ship.name;
                        $scope.order.shipItemId = $scope.order.shipItem._id;

                        if (order.shipItem.stripping === ngivr.settings.strippingType.sack) {
                            $scope.order.serviceTypes[1].partner = null;
                            $scope.order.serviceTypes[1].serviceContractId = null;
                        }

                        if (!$scope.order.hasOwnProperty('_id')) {
                            $scope.order.name = await $scope.setNumber(`EKZ${ngivr.settings.plusPrefix}`);
                            $scope.order.orderNumber = $scope.order.name;
                            $scope.order.needContract = true;
                            $scope.order.finalized = true;
                            $scope.order.shipOutType = ngivrSettings.shipOutType.ekz;
                            $scope.order.createdByOrderWonder = true;
                            $http.post('/api/orders/', $scope.order).then(async function (response) {
                                $scope.order._id = response.data._id;
                                $scope.edited.order = false;
                                $scope.order.selectedActualServiceContract = [];

                                if ($scope.order.serviceTypes[0].serviceContractId !== undefined) {
                                    let data = await ngivrApi.id('serviceContract', $scope.order.serviceTypes[0].serviceContractId);
                                    $scope.order.selectedActualServiceContract.push(data.data.doc);
                                }
                                else {
                                    $scope.order.selectedActualServiceContract.push({});
                                }

                                if ($scope.order.serviceTypes[1].serviceContractId !== undefined) {
                                    let data = await ngivrApi.id('serviceContract', $scope.order.serviceTypes[1].serviceContractId);
                                    $scope.order.selectedActualServiceContract.push(data.data.doc);
                                }
                                else {
                                    $scope.order.selectedActualServiceContract.push({});
                                }

                                if ($scope.order.serviceTypes[2].serviceContractId !== undefined) {
                                    let data = await ngivrApi.id('serviceContract', $scope.order.serviceTypes[2].serviceContractId);
                                    $scope.order.selectedActualServiceContract.push(data.data.doc);
                                }
                                else {
                                    $scope.order.selectedActualServiceContract.push({});
                                }

                                $scope.origOrder = angular.copy($scope.order);
                                $scope.edited.order = false;
                                $scope.publish('ngivrOrderSaved', $scope.order);
                            });
                            // })
                        }
                        else {
                            // await ngivrLockService.unlock('order:' + $scope.order._id);
                            delete $scope.order.__v;
                            $scope.order.shipOutType = ngivrSettings.shipOutType.ekz;
                            $http.put('/api/orders/' + $scope.order._id, $scope.order).then(async function () {
                                $scope.edited.order = false;
                                $scope.publish('ngivrOrderSaved', $scope.order);
                                $scope.order.selectedActualServiceContract = [];

                                if ($scope.order.serviceTypes[0].serviceContractId !== undefined) {
                                    let data = await ngivrApi.id('serviceContract', $scope.order.serviceTypes[0].serviceContractId);
                                    $scope.order.selectedActualServiceContract.push(data.data.doc);
                                }
                                else {
                                    $scope.order.selectedActualServiceContract.push({});
                                }

                                if ($scope.order.serviceTypes[1].serviceContractId !== undefined) {
                                    let data = await ngivrApi.id('serviceContract', $scope.order.serviceTypes[1].serviceContractId);
                                    $scope.order.selectedActualServiceContract.push(data.data.doc);
                                }
                                else {
                                    $scope.order.selectedActualServiceContract.push({});
                                }

                                if ($scope.order.serviceTypes[2].serviceContractId !== undefined) {
                                    let data = await ngivrApi.id('serviceContract', $scope.order.serviceTypes[2].serviceContractId);
                                    $scope.order.selectedActualServiceContract.push(data.data.doc);
                                }
                                else {
                                    $scope.order.selectedActualServiceContract.push({});
                                }

                                $scope.origOrder = angular.copy($scope.order);
                                $scope.edited.order = false;
                                $scope.publish('ngivrOrderSaved', $scope.order);
                            });
                        }
                    }

                    async function SaveBTO() {

                        $scope.publish('ngivrOrderNewRemove', $scope.initOrder);

                        $scope.order.serviceTypes[0].serviceContractId = $scope.order.selectedActualServiceContract[0]._id;
                        $scope.order.serviceTypes[1].serviceContractId = $scope.order.selectedActualServiceContract[1]._id;
                        $scope.order.shipId = $scope.order.ship._id;
                        $scope.order.shipName = $scope.order.ship.name;
                        $scope.order.shipItemId = $scope.order.shipItem._id;

                        if (!$scope.order.hasOwnProperty('_id')) {
                            $scope.order.name = await $scope.setNumber(`BTO${ngivr.settings.plusPrefix}`);
                            $scope.order.orderNumber = $scope.order.name;
                            $scope.order.needContract = true;
                            $scope.order.finalized = true;
                            $scope.order.shipOutType = ngivrSettings.shipOutType.bto;
                            $scope.order.createdByOrderWonder = true;
                            $http.post('/api/orders/', $scope.order).then(async function (response) {
                                $scope.order._id = response.data._id;
                                $scope.edited.order = false;
                                $scope.order.selectedActualServiceContract = [];

                                if ($scope.order.serviceTypes[0].serviceContractId !== undefined) {
                                    let data = await ngivrApi.id('serviceContract', $scope.order.serviceTypes[0].serviceContractId);
                                    $scope.order.selectedActualServiceContract.push(data.data.doc);
                                }
                                else {
                                    $scope.order.selectedActualServiceContract.push({});
                                }

                                if ($scope.order.serviceTypes[1].serviceContractId !== undefined) {
                                    let data = await ngivrApi.id('serviceContract', $scope.order.serviceTypes[1].serviceContractId);
                                    $scope.order.selectedActualServiceContract.push(data.data.doc);
                                }
                                else {
                                    $scope.order.selectedActualServiceContract.push({});
                                }

                                $scope.origOrder = angular.copy($scope.order);
                                $scope.edited.order = false;
                                $scope.publish('ngivrOrderSaved', $scope.order);
                            });
                            // })
                        }
                        else {
                            // await ngivrLockService.unlock('order:' + $scope.order._id);
                            delete $scope.order.__v;
                            $scope.order.shipOutType = ngivrSettings.shipOutType.bto;
                            $http.put('/api/orders/' + $scope.order._id, $scope.order).then(async function () {
                                $scope.edited.order = false;
                                $scope.publish('ngivrOrderSaved', $scope.order);
                                $scope.order.selectedActualServiceContract = [];

                                if ($scope.order.serviceTypes[0].serviceContractId !== undefined) {
                                    let data = await ngivrApi.id('serviceContract', $scope.order.serviceTypes[0].serviceContractId);
                                    $scope.order.selectedActualServiceContract.push(data.data.doc);
                                }
                                else {
                                    $scope.order.selectedActualServiceContract.push({});
                                }

                                if ($scope.order.serviceTypes[1].serviceContractId !== undefined) {
                                    let data = await ngivrApi.id('serviceContract', $scope.order.serviceTypes[1].serviceContractId);
                                    $scope.order.selectedActualServiceContract.push(data.data.doc);
                                }
                                else {
                                    $scope.order.selectedActualServiceContract.push({});
                                }


                                $scope.origOrder = angular.copy($scope.order);
                                $scope.edited.order = false;
                                $scope.publish('ngivrOrderSaved', $scope.order);
                            });
                        }
                    }
                };

                // $scope.cancelOrderTimeout = () => {
                //     $scope.cancelOrder(true, $scope.idx, $scope.origOrder)
                // }

                $scope.isValueInDepotsWithProduct = () => {
                    if ($scope.order.depotsWithProduct.length > 0) {
                        let hasValue = false;
                        for (let i in $scope.order.depotsWithProduct) {
                            if ($scope.order.depotsWithProduct[i].quantity != null || $scope.order.depotsWithProduct[i].quantity !== undefined) {
                                hasValue = true;
                            }
                        }

                        if (!hasValue) {
                            ngivrGrowl('Kérem adjon meg legalább 1 raktárban mennyiséget.');
                            //return;
                        }
                        return hasValue
                    }
                    return true
                };

                /**
                 * Még nem mentett order törlése
                 * @returns {Promise<void>}
                 */
                $scope.cancelOrder = async function (options) {

                    if ($scope.order.underRemove) {
                        $scope.order.underRemove = false;

                        $scope.publish('forceCancel');
                        return
                    }
                    if ($scope.order.underClose) {
                        $scope.order.underClose = false;
                        $scope.publish('forceCancel');
                    }
                    const {timeout, idx} = options;
                    if (idx !== undefined && !$scope.order._id) {
                        await $scope.cancelOrderShipOn({timeout: timeout, idx: idx, origOrder: $scope.origOrder});
                        return
                    }
                    if (!$scope.order._id) {
                        if ($scope.removeOrderTab) {
                            $scope.removeOrderTab({tab: $scope.tab})
                        } else {
                            $scope.removeDispoTab({options: {tab: $scope.tab}})
                        }

                        return
                    }
                    $scope.order = angular.copy($scope.origOrder);
                    if ($scope.order.actualServiceContract) {
                        ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                            $scope.order.selectedActualServiceContract = response.data.doc;
                        });
                    }
                    if ($scope.order.sourceServiceContractId) {
                        ngivrApi.id('serviceContract', $scope.order.sourceServiceContractId).then(function (response) {
                            $scope.order.selectedSourceServiceContract = response.data.doc;
                        });
                    }

                    switch ($scope.mode) {

                        case $scope.availableMode.ekh:
                            if ($scope.order.serviceTypes && $scope.order.serviceTypes[0].serviceContractId) {
                                ngivrApi.id('serviceContract', $scope.order.serviceTypes[0].serviceContractId).then(function (response) {
                                    $scope.order.selectedActualServiceContract = response.data.doc;
                                });
                            }
                            break;
                        case $scope.availableMode.ekz:
                            $scope.loadService();
                            break;
                        case $scope.availableMode.bto:
                            $scope.loadCargoPlan();
                            $scope.loadService();
                            break;
                    }

                    if ($scope.order.shipId) {
                        ngivrApi.id('ship', $scope.order.shipId).then(function (response) {
                            $scope.order.ship = response.data.doc;

                            for (let i in $scope.order.ship.items) {
                                if ($scope.order.ship.items[i]._id === $scope.order.shipItemId) {
                                    $scope.order.shipItem = $scope.order.ship.items[i];
                                }
                            }
                        })
                    }
                    if ($scope.order._id) {
                        $scope.getLastTicketDate();
                    }

                    if (!timeout) {
                        // await ngivrLockService.unlock('order:' + $scope.order._id);
                    }
                    $scope.edited.order = false;
                    if (timeout) {
                        $scope.publish('popupSelectDepotMustClose')
                    }
                };
                let catchUnlockCallbackDestroyer

                /**
                 * Order szerkesztése
                 * @returns {Promise<void>}
                 */
                $scope.editOrder = async () => {
                    try {
                        // let lock = await ngivrLockService.lock('order:' + $scope.order._id, async () => {
                        //     await $scope.cancelOrder(true, $scope.idx, $scope.origOrder)
                        // });
                        if ($scope.order.depotsWithProduct) {
                            Object.defineProperty($scope.order, 'volume', {
                                configurable: true,
                                enumerable: true,
                                get: () => {
                                    if (!$scope.order.orderClosed) {
                                        let volume = 0;
                                        for (let depot of $scope.order.depotsWithProduct) {
                                            volume += depot.quantity ? depot.quantity : 0
                                        }
                                        return volume
                                    }


                                },
                                set: (value) => {
                                }
                            });
                        }
                        $scope.origOrder = angular.copy($scope.order);
                        $scope.edited.order = true;
                        // $scope.lock = lock;
                        // if (catchUnlockCallbackDestroyer !== undefined) {
                        //     catchUnlockCallbackDestroyer();
                        // }
                        //
                        // catchUnlockCallbackDestroyer = ngivrLockService.catchUnlockCallback($scope, 'order:' + $scope.order._id, $scope.cancelOrderTimeout);
                    } catch (e) {
                        console.error(e)
                    }

                };

                $scope.lockOrder = () => {

                };

                $scope.unlockOrder = () => {

                };

                /**
                 * Order törlése, már elmentett orderé
                 */
                $scope.removeOrder = async function () {

                    if ($scope.checkHasDepotPerformed()) {
                        ngivrGrowl('Törlés csak akkor lehetséges, ha nincs még teljesített mennyiség a raktáron.');
                        return;
                    }
                    $scope.lockOrder();
                    $scope.order.underRemove = true;
                    try {
                        //await ngivrLockService.lock('order:' + $scope.order._id);

                        await ngivrConfirm('Biztosan töröljem?', 'Letöröltem.');
                    } catch (e) {
                        $scope.order.underRemove = false;
                        $scope.unlockOrder();
                        return
                        // await ngivrLockService.unlock('order:' + $scope.order._id);
                    }
                    //await ngivrLockService.unlock('order:' + $scope.order._id);
                    //$scope.setLock({order: $scope.order, lock: false}); //orderlock oldás
                    // for (let i in $scope.order.depotsWithProduct) {
                    //     $scope.order.depotsWithProduct[i].quantity = null;
                    //
                    //     $http.get('/api/depots/' + $scope.order.depotsWithProduct[i]._id.depotId).then(function (response) {
                    //         const depot = response.data;
                    //         if (depot.reserved === undefined) {
                    //             depot.reserved = {
                    //                 orders: [],
                    //                 plans: [],
                    //             }
                    //         }
                    //         for (let j in $scope.order.depotsWithProduct) {
                    //             if ($scope.order.depotsWithProduct[j].orderId === $scope.order._id) {
                    //                 depot.reserved.orders.splice(j, 1);
                    //             }
                    //         }
                    //         $http.put('/api/depots/' + depot._id, depot).then(function () {
                    //             //ngivrGrowl('Depot saved');
                    //             save();
                    //         })
                    //     })
                    // }
                    if ($scope.order.depotsWithProduct) {
                        // $scope.saveDepots().then(function () {
                        $http.put('/api/orders/' + $scope.order._id, {
                            deleted: true
                        }).then(function (response) {
                            // ngivrDataId.destroy();
                            // $scope.publish('orderDeleted', $scope.order);
                            $scope.order = Object.assign($scope.order, response.data);
                        })
                        // });
                    }
                    else {
                        $http.put('/api/orders/' + $scope.order._id, {
                            deleted: true
                        }).then(function (response) {
                            //  $scope.$destroy();
                            $scope.order = response.data;
                            if ($scope.order.actualServiceContract) {
                                ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                                    $scope.order.selectedActualServiceContract = response.data.doc;
                                    $scope.origOrder = angular.copy($scope.order);
                                    $scope.edited.order = false;
                                    $scope.publish('ngivrOrderSaved', $scope.order);
                                })
                            }
                            else {
                                $scope.origOrder = angular.copy($scope.order);
                                $scope.edited.order = false;
                                $scope.publish('ngivrOrderSaved', $scope.order);
                            }
                        })
                    }
                    $scope.unlockOrder()


                };

                /**
                 * Azt ellenőrzi, történt-e teljesítés az orderre
                 * @returns {boolean}
                 */
                $scope.checkHasDepotPerformed = function () {
                    if ($scope.order.performed) {
                        return true
                    }
                    return false

                    // if ($scope.order.loadDepot.length > 0) {
                    //     for (let i in $scope.order.loadDepot) {
                    //         if ($scope.order.loadDepot[i].performed !== 0) {
                    //             return true;
                    //         }
                    //     }
                    // }
                    //
                    // return false;
                };

                /**
                 * Adott order zárolását, illetve a gombok inaktivitását ellenőrzi
                 * @param order
                 * @returns {boolean}
                 */
                $scope.isOrderLocked = function (order) {
                    if ($scope.buttonDisabled) {
                        return true
                    }
                    if (order.deleted || order.orderClosed) {
                        return true
                    }
                    try {
                        let lock = $scope.redisLockList.filter((o) => {
                            return o.doc === 'order:' + order._id
                        });

                        if (!lock.length) return false;

                        if (lock[0].user !== Auth.getCurrentUser()._id) return true;

                    }
                    catch (err) {
                        return false
                    }
                    return false;
                };

                /**
                 * order lezárása
                 */
                $scope.closeOrder = function () {
                    $scope.order.underClose = true;
                    ngivrConfirm('Biztosan zárhatom?', 'Lezártam.').then(async () => {
                        $scope.order.orderClosed = true; //az ordert lezárta állítjuk
                        $scope.edited.order = false;
                        delete $scope.order.__v;
                        // await ngivrLockService.unlock('order:' + $scope.order._id);
                        //$scope.setLock({order: $scope.order, lock: false});  //orderlock oldás
                        if ($scope.order.depotsWithProduct) {
                            for (let i in $scope.order.depotsWithProduct) {
                                $scope.order.depotsWithProduct[i].quantity = null;

                                $http.get('/api/depots/' + $scope.order.depotsWithProduct[i]._id.depotId).then(function (response) {
                                    const depot = response.data;
                                    if (depot.reserved === undefined) {
                                        depot.reserved = {
                                            orders: [],
                                            plans: [],
                                        }
                                    }
                                    for (let j in $scope.order.depotsWithProduct) {
                                        if ($scope.order.depotsWithProduct[j].orderId === $scope.order._id) {
                                            depot.reserved.orders.splice(j, 1);
                                        }
                                    }
                                    delete depot.__v;
                                    $http.put('/api/depots/' + depot._id, depot).then(function () {
                                        //ngivrGrowl('Depot saved');
                                        save();
                                    })
                                })
                            }
                        }
                        else {
                            save();
                        }

                        function save() {
                            $http.put('api/orders/' + $scope.order._id, $scope.order).then(function (response) //frissítjük az ordert
                            {
                                $scope.order = response.data;
                                $scope.origOrder = response.data;
                                $scope.edited.order = false;
                                if ($scope.order.actualServiceContract) {
                                    ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                                        $scope.order.selectedActualServiceContract = response.data.doc;
                                    });
                                }
                                if ($scope.order.sourceServiceContractId) {
                                    ngivrApi.id('serviceContract', $scope.order.sourceServiceContractId).then(function (response) {
                                        $scope.order.selectedSourceServiceContract = response.data.doc;
                                    });
                                }
                                // $scope.loadDepots();
                                if ($scope.order.cargoPlanId) {
                                    $scope.getDispoList($scope.order.cargoPlanId);
                                }
                                if ($scope.order.contractId) {
                                    $http.put('/api/contracts/' + $scope.order.contractId, {
                                        closeOrder: true,
                                        orderId: $scope.order._id,
                                        performed: $scope.order.performed
                                    })
                                }

                                $scope.publish('ngivrOrderSaved', $scope.order);
                                $scope.order.underClose = false;
                                $scope.unlockOrder()
                            })
                        }

                    });
                };

                /**
                 * order újranyitása
                 */
                $scope.reopenOrder = function () {
                    let freeTodispo = 0;
                    if ($scope.order.relatedContract) {
                        freeTodispo = $scope.calculateEdges($scope.order.relatedContract[0], 'max');
                    }
                    else {
                        freeTodispo = $scope.order.volume;
                    }

                    if (freeTodispo >= $scope.order.volume) {
                        alert('eredetivel nyitható disponálható: ' + freeTodispo + ' eredeti: ' + $scope.order.volume);
                        $scope.order.orderClosed = false;
                        ngivrHttp.put('/api/orders/' + $scope.order._id, $scope.order).then(function () {
                            if ($scope.order.contractId) {
                                ngivrHttp.put('/api/contracts/' + $scope.order.contractId, {
                                    reopenOrder: true,
                                    orderId: $scope.order._id,
                                    weight: $scope.order.volume
                                })
                            }
                        });
                        $scope.publish('ngivrOrderSaved', $scope.order);
                    } else {
                        if (freeTodispo - $scope.order.performed > 0) {
                            alert('nem nyitható eredetivel,  disponálható: ' + freeTodispo + ' eredeti: ' + $scope.order.volume);
                            $scope.order.orderClosed = false;
                            $scope.order.weight = freeTodispo;
                            ngivrHttp.put('/api/orders/' + $scope.order._id, $scope.order).then(function () {
                                if ($scope.order.contractId) {
                                    ngivrHttp.put('/api/contracts/' + $scope.order.contractId, {
                                        reopenOrder: true,
                                        orderId: $scope.order._id,
                                        weight: freeTodispo
                                    })
                                }
                            });
                            $scope.publish('ngivrOrderSaved', $scope.order);
                        } else {
                            alert('nem nyitható újra ' + 'disponálható: ' + freeTodispo + ' eredeti: ' + $scope.order.volume);
                            ngivr.growl('A diszpo nem nyitható újra', 'info')
                        }
                    }
                };

                $scope.calculateEdges = function (contract, edge) {
                    switch (edge) {
                        case 'min':
                            return $scope.calculateFreeToDispo(contract) - contract.quantity * contract.percentMinusValue / 100;

                        case 'max':
                            return $scope.calculateFreeToDispo(contract) + contract.quantity * contract.percentPlusValue / 100;

                    }

                };

                $scope.calculateFreeToDispo = function (contract) {
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
                    return contract.quantity - reserved;
                };

                /**
                 * Raktárlista lekérése, ha szükséges, akkor beállítja, hogy a tervezett mennyiség
                 * ki legyen számolva
                 * @param site
                 * @returns {Promise<void>}
                 */
                $scope.getDepots = async (site) => {
                    if ($scope.mode === $scope.availableMode.pkt || $scope.mode === $scope.availableMode.int || $scope.mode === $scope.availableMode.sht || $scope.mode === $scope.availableMode.pht) {
                        Object.defineProperty($scope.order, 'volume', {
                            configurable: true,
                            enumerable: true,
                            get: () => {
                                if ($scope.order.depotsWithProduct) {
                                    let volume = 0;
                                    for (let depot of $scope.order.depotsWithProduct) {
                                        volume += depot.quantity ? depot.quantity : 0
                                    }
                                    return volume
                                }
                            },
                            set: (value) => {
                            }
                        });
                    }
                    if (site !== undefined && site !== null
                        && $scope.order.orderProduct.length !== 0 && $scope.order.orderProduct[0] !== null && $scope.order.orderProduct[0] !== undefined
                        && $scope.order.partner[0] !== undefined && $scope.order.partner[0] !== null && !$scope.order.depotsWithProduct) {

                        await $scope.setDepotsWithProduct(site)


                    }
                };


                /**
                 * Lekéri a raktárlistát adott telephelyre, partnerre és terményre vonatkozóan
                 */
                $scope.setDepotsWithProduct = async (site) => {
                    if ((($scope.order.partner && $scope.order.partner[0]) && $scope.order.selectedSourceServiceContract || $scope.order.sygnus) && $scope.order.orderProduct && $scope.order.orderProduct.length && $scope.order.orderProduct[0]) {
                        let query = {
                            partnerId: $scope.order.sygnus ? ngivr.settings.ownFirm._id : $scope.order.partner[0]._id,
                            productId: $scope.order.orderProduct[0]._id,
                            siteId: site._id,
                            serviceContractId: $scope.order.selectedSourceServiceContract ? $scope.order.selectedSourceServiceContract._id : undefined
                            //own: $scope.order.sygnus
                        };
                        let response = await ngivrHttp.get('api/depots/getDepotsByParameters', {params: query});
                        let depotsWithProduct = response.data.depots;
                        if ($scope.order.loadDepot === undefined) {
                            $scope.order.depotsWithProduct = angular.copy(depotsWithProduct);
                            return;
                        }

                        for (let loadDepot of depotsWithProduct) {
                            let depot = $scope.getDepot($scope.order.loadDepot, loadDepot._id.depotId, loadDepot._id.productId);

                            if (depot) {
                                if ($scope.order.loadDepot && $scope.order.loadDepot.length) {
                                    let loadDepotIdx = Common.functiontofindIndexByKeyValue($scope.order.loadDepot, 'depot', loadDepot._id.depotId);
                                    if (loadDepotIdx !== null) {
                                        $scope.order.loadDepot[loadDepotIdx].depotName = loadDepot.depotName
                                    }
                                }
                                loadDepot.quantity = depot.quantity;
                                loadDepot.performed = depot.performed
                            }
                        }
                        if (!angular.equals($scope.order.depotsWithProduct, depotsWithProduct)) {
                            $scope.order.depotsWithProduct = angular.copy(depotsWithProduct);
                        }

                    }

                };

                /**
                 * Lekéri a raktárlistát
                 * nem kell, mert a raktárlistát lekérjük, ha változik a raktár
                 * @returns {Promise<void>}
                 */
                $scope.loadDepots = async function () {
                    if ($scope.order._id) {
                        if ($scope.order.loadDepot.length && $scope.order.loadDepot[0] !== null) {

                            await $scope.setDepotsWithProduct($scope.order.loadLocation[0])

                        }
                    }
                };

                $scope.getDepot = function (list, depotId, productId) {
                    for (let depot of list) {
                        if (depot._id && depot._id.depotId !== undefined) {
                            if (depotId === depot._id.depotId && productId === depot._id.productId) {
                                return depot;
                            }
                        }
                        else {
                            if (depotId === depot.depot && productId === depot.product) {
                                return depot;
                            }
                        }
                    }
                };

                /**
                 * Utolsó mérés dátumát állítja be
                 */
                $scope.getLastTicketDate = async function () {

                    let resp = await ngivrHttp.get('/api/tickets/get-last-ticket-date-for-order/' + $scope.order._id);
                    console.log(resp);
                    if (resp.data.length) {
                        $scope.order.lastTicketAt = resp.data[0].createdAt;
                    } else {
                        $scope.order.lastTicketAt = undefined
                    }
                };

                $scope.subscribe('ngivrOrderSaved', async () => {
                    await $scope.getLastTicketDate();
                });


                $scope.saveDepots = function () {
                    return; //nem véletlen a return, amint 100%, hogy nem kell az utána következő rész, akkor a teljes függvényt törlöm
                    let deferred = $q.defer();

                    let counter = 0;
                    if ($scope.order.depotsWithProduct.length > 0) {
                        for (let i in $scope.order.depotsWithProduct) {
                            if ($scope.order.depotsWithProduct[i].quantity != null || $scope.order.depotsWithProduct[i].quantity !== undefined) {
                                if ($scope.order.loadDepot) {
                                    let items = $scope.order.loadDepot.filter(function (obj) {
                                        return obj.depot === $scope.order.depotsWithProduct[i]._id.depotId && obj.product === $scope.order.depotsWithProduct[i]._id.productId;
                                    });

                                    if (items.length > 0) {
                                        $scope.order.volume -= items[0].quantity;
                                        items[0].quantity = $scope.order.depotsWithProduct[i].quantity;
                                        $scope.order.volume += $scope.order.depotsWithProduct[i].quantity;
                                        counter += 1;
                                        save();
                                    }
                                    else {
                                        $scope.order.loadDepot.push(
                                            {
                                                depot: $scope.order.depotsWithProduct[i]._id.depotId,
                                                quantity: $scope.order.depotsWithProduct[i].quantity,
                                                product: $scope.order.depotsWithProduct[i]._id.productId,
                                            }
                                        );

                                        $scope.order.volume += $scope.order.depotsWithProduct[i].quantity;
                                        counter += 1;

                                        $http.get('/api/depots/' + $scope.order.depotsWithProduct[i]._id.depotId).then(function (response) {
                                            const depot = response.data;
                                            if (depot.reserved === undefined) {
                                                depot.reserved = {
                                                    orders: [],
                                                    plans: [],
                                                }
                                            }
                                            depot.reserved.orders.push({orderId: $scope.order._id});
                                            delete depot.__v;
                                            $http.put('/api/depots/' + depot._id, depot).then(function () {
                                                //ngivrGrowl('Depot saved');
                                                save();
                                            })
                                        })
                                    }
                                }
                                else {
                                    $scope.order.loadDepot = [];
                                    $scope.order.loadDepot.push(
                                        {
                                            depot: $scope.order.depotsWithProduct[i]._id.depotId,
                                            quantity: $scope.order.depotsWithProduct[i].quantity,
                                            product: $scope.order.depotsWithProduct[i]._id.productId,
                                        }
                                    );

                                    $scope.order.volume += $scope.order.depotsWithProduct[i].quantity;
                                    counter += 1;

                                    $http.get('/api/depots/' + $scope.order.depotsWithProduct[i]._id.depotId).then(function (response) {
                                        const depot = response.data;
                                        if (depot.reserved === undefined) {
                                            depot.reserved = {
                                                orders: [],
                                                plans: [],
                                            }
                                        }
                                        depot.reserved.orders.push({orderId: $scope.order._id});
                                        delete depot.__v;
                                        $http.put('/api/depots/' + depot._id, depot).then(function () {
                                            //ngivrGrowl('Depot saved');
                                            save();
                                        })
                                    })
                                }
                            }
                            else {
                                if ($scope.order.loadDepot) {
                                    let items = $scope.order.loadDepot.filter(function (obj) {
                                        return obj.depot === $scope.order.depotsWithProduct[i]._id.depotId && obj.product === $scope.order.depotsWithProduct[i]._id.productId;
                                    });

                                    if (items.length > 0) {
                                        let idx = -1;
                                        for (let j in $scope.order.loadDepot) {
                                            if (items[0].depot === $scope.order.loadDepot[j].depot && items[0].product === $scope.order.loadDepot[j].product) {
                                                idx = j;
                                                break;
                                            }
                                        }

                                        if (idx >= 0) {
                                            $scope.order.volume -= $scope.order.loadDepot[idx].quantity;
                                            $scope.order.loadDepot.splice(idx, 1);
                                            counter += 1;
                                            save();
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        deferred.resolve();
                    }

                    function save() {
                        delete $scope.order.__v;
                        $http.put('/api/orders/' + $scope.order._id, $scope.order).then(function (response) {
                            Object.assign($scope.order, response.data);
                            //$scope.order = response.data;
                            $scope.origOrder = angular.copy($scope.order);
                            $scope.edited.order = false;

                            counter -= 1;

                            if (counter === 0) {
                                deferred.resolve();
                            }
                        });
                    }

                    return deferred.promise;

                };

                $scope.getDispoList = async function (cargoPlanId) {
                    $scope.dispoList = [];

                    let query = {
                        limit: 0,
                        search: {
                            cargoPlanId: cargoPlanId,
                            deleted: false,
                        }
                    };
                    let resp = await ngivrApi.query('order', query);
                    $scope.dispoList = resp.data.docs;

                    // let request = {
                    //     cargoPlanId: cargoPlanId,
                    //     deleted: false,
                    // };
                    //
                    //
                    // $http.get('/api/orders/', {params: request}).then(function (response) {
                    //     $scope.dispoList = response.data;
                    // });
                };

                $scope.setLoadLocation = async function () {
                    if ($scope.order.cargoPlanId && $scope.order._id === undefined) {
                        let resp = await ngivrApi.id('cargoPlan', $scope.order.cargoPlanId, {populate: ngivr.settings.populate.cargoPlan});
                        $scope.order.loadLocation = resp.data.doc.loadPlace;
                        // $http.get('/api/cargoPlans/' + $scope.order.cargoPlanId).then(function (response) {
                        //     $scope.order.loadLocation = response.data.loadPlace
                        // })
                    }
                };

                $scope.checkIsITK = function () {
                    if ($scope.order.loadLocation.length && $scope.order.loadLocation[0] != null && $scope.order.loadLocation[0] !== undefined) {

                        // if (!$scope.order.loadLocation[0].own && $scope.order.sygnus !== true) {
                        //     ngivrGrowl('Csak saját felrakóhely lehet');
                        //     $scope.order.loadLocation[0] = undefined;
                        //     return;
                        // }

                        //$scope.order.ITK = !$scope.order.loadLocation[0].ownScale
                        $scope.order.ITK = !$scope.order.loadLocation[0].own || !$scope.order.loadLocation[0].privat;
                    }
                };


                $scope.fromContract = function (dispo) //ekáer feladó, címzett adatok a szerződésből
                {
                    if (dispo.relatedContract[0].buy) {
                        dispo.seller = dispo.relatedContract[0].partner[0];
                        dispo.destination = $scope.ownFirm;
                        dispo.ekaerDestinationVat = ngivr.settings.ownFirm.vatNumberHU
                    } else {
                        dispo.seller = $scope.ownFirm;
                        dispo.ekaerSellerVat = ngivr.settings.ownFirm.vatNumberHU;
                        dispo.destination = dispo.relatedContract[0].partner[0];
                    }
                };

                $scope.filterRequery = function () {
                    ngivr.list.requery($scope);
                };

                /**
                 * serviceConract id-k alapján kitölti az order serviceContract mezőit
                 * @returns {Promise<void>}
                 */
                $scope.loadService = async function () {
                    $scope.order.selectedActualServiceContract = [];

                    if ($scope.order.serviceTypes[0].serviceContractId !== undefined) {
                        let data = await ngivrApi.id('serviceContract', $scope.order.serviceTypes[0].serviceContractId);
                        $scope.order.selectedActualServiceContract.push(data.data.doc);
                    }
                    else {
                        $scope.order.selectedActualServiceContract.push({});
                    }

                    if ($scope.order.serviceTypes[1].serviceContractId !== undefined) {
                        let data = await ngivrApi.id('serviceContract', $scope.order.serviceTypes[1].serviceContractId);
                        $scope.order.selectedActualServiceContract.push(data.data.doc);
                    }
                    else {
                        $scope.order.selectedActualServiceContract.push({});
                    }

                    if ($scope.order.serviceTypes.length > 2) {
                        if ($scope.order.serviceTypes[2].serviceContractId !== undefined) {
                            let data = await ngivrApi.id('serviceContract', $scope.order.serviceTypes[2].serviceContractId);
                            $scope.order.selectedActualServiceContract.push(data.data.doc);
                        }
                        else {
                            $scope.order.selectedActualServiceContract.push({});
                        }
                    }
                };

                $scope.loadCargoPlan = async function () {
                    let data = await $http.get('/api/cargoPlans/' + $scope.order.cargoPlanId);
                    $scope.order.cargoPlan = data.data;
                };

                if ($scope.order._id === undefined) {
                    angular.merge($scope.defaultOrder, $scope.order);
                    $scope.order = angular.copy($scope.defaultOrder);
                    $scope.origOrder = angular.copy($scope.defaultOrder);
                    $scope.initOrder = angular.copy($scope.order);
                }
                else {
                    $scope.order = $scope.order;
                    $scope.origOrder = angular.copy($scope.order);
                    $scope.getLastTicketDate();
                }

                //Belső áttárolás
                if ($scope.order.direction === 'internal') {
                    if ($scope.order.intShip) {
                        $scope.mode = $scope.availableMode.sht;
                    } else {
                        $scope.mode = $scope.availableMode.int;
                    }

                    if ($scope.order.actualServiceContract) {
                        ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                            $scope.order.selectedActualServiceContract = response.data.doc;
                        });
                    }
                    if ($scope.order.sourceServiceContractId) {
                        ngivrApi.id('serviceContract', $scope.order.sourceServiceContractId).then(function (response) {
                            $scope.order.selectedSourceServiceContract = response.data.doc;
                        });
                    }
                    if ($scope.order.cargoPlanId) {
                        $scope.getDispoList($scope.order.cargoPlanId);
                    }
                    $scope.vehicleData = ngivr.json.clone($scope.defaultVehicleData);
                    if ($scope.order.contractId) {
                        ngivrApi.id('contract', $scope.order.contractId).then(function (response) {
                            dispo.relatedContract = [response.data.doc];
                        });
                    }
                    else {
                        //ngivrGrowl('Nincs szerződés megadva')
                    }
                    $scope.loadDepots();
                    $scope.formTitle = $scope.order.intShip ? $scope.order.sygnus ? 'Sygnus hajórakodás külső tárházból' : 'Partner hajórakodás külső tárházból' : 'Belső áttárolás';
                    if (!$scope.order._id) {
                        Object.defineProperty($scope.order, 'volume', {
                            configurable: true,
                            enumerable: true,
                            get: () => {
                                if ($scope.order.depotsWithProduct) {
                                    let volume = 0;
                                    for (let depot of $scope.order.depotsWithProduct) {
                                        volume += depot.quantity ? depot.quantity : 0
                                    }
                                    return volume
                                }
                            },
                            set: (value) => {
                            }
                        });
                    }
                }

                //Egyenes kiszállítás hajóból zsákban
                if ($scope.order.direction === 'external_out' && $scope.order.sygnus === false && $scope.order.putInBags === true && $scope.order.cargoPlanId != null) {
                    $scope.mode = $scope.availableMode.ekz;

                    if ($scope.order.shipId) {
                        ngivrApi.id('ship', $scope.order.shipId).then(function (response) {
                            $scope.order.ship = response.data.doc;

                            for (let i in $scope.order.ship.items) {
                                if ($scope.order.ship.items[i]._id === $scope.order.shipItemId) {
                                    $scope.order.shipItem = $scope.order.ship.items[i];
                                }
                            }
                        })
                    }

                    $scope.order.selectedActualServiceContract = [];
                    $scope.order.fertilizer = true;

                    $scope.loadService();

                    $scope.formTitle = 'Egyenes kiszállítás hajóból zsákban';
                }
                else {

                    //Egyenes kiszállítás hajóból
                    if ($scope.order.direction === 'external_out' && $scope.order.sygnus === false && $scope.order.cargoPlanId != null) {
                        $scope.mode = $scope.availableMode.ekh;

                        if ($scope.order.shipId) {
                            ngivrApi.id('ship', $scope.order.shipId).then(function (response) {
                                $scope.order.ship = response.data.doc;

                                for (let i in $scope.order.ship.items) {
                                    if ($scope.order.ship.items[i]._id === $scope.order.shipItemId) {
                                        $scope.order.shipItem = $scope.order.ship.items[i];
                                    }
                                }
                            })
                        }

                        if ($scope.order.serviceTypes[0].serviceContractId) {
                            ngivrApi.id('serviceContract', $scope.order.serviceTypes[0].serviceContractId).then(function (response) {
                                $scope.order.selectedActualServiceContract = response.data.doc;
                            })
                        }

                        $scope.formTitle = 'Egyenes kiszállítás hajóból';
                        $scope.order.fertilizer = true;
                    }

                }

                //Betárolás hajóból tárházba ömlesztve
                if ($scope.order.direction === 'in' && $scope.order.sygnus === false && $scope.order.cargoPlanId != null) {
                    $scope.mode = $scope.availableMode.bto;

                    if ($scope.order.shipId) {
                        ngivrApi.id('ship', $scope.order.shipId).then(function (response) {
                            $scope.order.ship = response.data.doc;

                            for (let i in $scope.order.ship.items) {
                                if ($scope.order.ship.items[i]._id === $scope.order.shipItemId) {
                                    $scope.order.shipItem = $scope.order.ship.items[i];
                                }
                            }
                        })
                    }

                    $scope.order.selectedActualServiceContract = [];
                    $scope.order.fertilizer = true;

                    $scope.loadCargoPlan();
                    $scope.loadService();

                    $scope.formTitle = 'Betárolás hajóból tárházba ömlesztve';
                }

                //partner beszállítás tárházba: partneres (Sygnus false) és direction in, nincs nominálás
                if ($scope.order.sygnus === false && $scope.order.direction === 'in' && $scope.order.cargoPlanId == null) {
                    $scope.mode = $scope.availableMode.pbt;

                    if ($scope.order.actualServiceContract) {
                        ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                            $scope.order.selectedActualServiceContract = response.data.doc;
                        })
                    }

                    $scope.formTitle = 'Partner beszállítás tárházba';
                }

                //partner kiszállítás tárházból: partneres (Sygnus false) és direction out, nincs nominálás
                if ($scope.order.sygnus === false && $scope.order.direction === 'out' && $scope.order.cargoPlanId === null) {
                    $scope.mode = $scope.availableMode.pkt;
                    $scope.loadDepots();
                    if ($scope.order.actualServiceContract) {
                        ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                            $scope.order.selectedActualServiceContract = response.data.doc;
                        });
                    }
                    if ($scope.order.sourceServiceContractId) {
                        ngivrApi.id('serviceContract', $scope.order.sourceServiceContractId).then(function (response) {
                            $scope.order.selectedSourceServiceContract = response.data.doc;
                        });
                    }

                    $scope.formTitle = 'Partner kiszállítás tárházból';
                    if (!$scope.order._id) {
                        Object.defineProperty($scope.order, 'volume', {
                            configurable: true,
                            enumerable: true,
                            get: () => {
                                if ($scope.order.depotsWithProduct) {
                                    let volume = 0;
                                    for (let depot of $scope.order.depotsWithProduct) {
                                        volume += depot.quantity ? depot.quantity : 0
                                    }
                                    return volume
                                }
                            },
                            set: (value) => {
                            }
                        });
                    }
                }

                //Sygnus hajórakodás tárházból: Sygnus=true, cargoplan ship on, direction=out
                if ($scope.order.sygnus === true && $scope.order.direction === 'out' && $scope.order.cargoPlanId != null) {
                    $http.get('/api/cargoPlans/' + $scope.order.cargoPlanId).then(function (response) {

                        if (response.data.transportType === 'shipOn') {
                            $scope.mode = $scope.availableMode.sht;
                            //$scope.loadDepots();
                        }

                        if ($scope.mode == null) {
                            ngivrGrowl('Nem azonosítható a dispó típusa');
                        }

                        $scope.formTitle = 'Sygnus hajórakodás tárházból';
                        if (!$scope.order._id) {
                            Object.defineProperty($scope.order, 'volume', {
                                configurable: true,
                                enumerable: true,
                                get: () => {
                                    if ($scope.order.depotsWithProduct) {
                                        let volume = 0;
                                        for (let depot of $scope.order.depotsWithProduct) {
                                            volume += depot.quantity ? depot.quantity : 0
                                        }
                                        return volume
                                    }
                                },
                                set: (value) => {
                                }
                            });
                        }

                    })
                }
                else {
                    //Partner hajórakódás tárházból: sygnus false, direction out, cargoplan ship on
                    if ($scope.order.sygnus === false && $scope.order.direction === 'out' && $scope.order.cargoPlanId != null) {
                        $http.get('/api/cargoPlans/' + $scope.order.cargoPlanId).then(async function (response) {

                            if (response.data.transportType === 'shipOn') {
                                $scope.mode = $scope.availableMode.pht;
                                //$scope.loadDepots();
                                await $scope.setLoadLocation();
                                // if ($scope.order.actualServiceContract) {
                                //   ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                                //     $scope.order.selectedActualServiceContract = response.data.doc;
                                //   });
                                // }
                                // if ($scope.order.sourceServiceContractId) {
                                //   ngivrApi.id('serviceContract', $scope.order.sourceServiceContractId).then(function (response) {
                                //     $scope.order.selectedSourceServiceContract = response.data.doc;
                                //   });
                                // }
                            }

                            if ($scope.mode == null) {
                                ngivrGrowl('Nem azonosítható a dispó típusa');
                            }

                            $scope.formTitle = 'Partner hajórakódás tárházból';
                            if (!$scope.order._id) {
                                Object.defineProperty($scope.order, 'volume', {
                                    configurable: true,
                                    enumerable: true,
                                    get: () => {


                                        if ($scope.order.depotsWithProduct) {
                                            let volume = 0;
                                            for (let depot of $scope.order.depotsWithProduct) {
                                                volume += depot.quantity ? depot.quantity : 0
                                            }
                                            return volume
                                        }
                                    },
                                    set: (value) => {
                                    }
                                });
                            }
                        })
                    }
                    else {
                        //Partner külső beszállítás hajóba: partneres (Sygnus false) és direction external_in, nincs nominálás
                        if ($scope.order.sygnus === false && $scope.order.direction === 'external_in' && $scope.order.cargoPlanId != null) {
                            $scope.mode = $scope.availableMode.pkb;

                            $scope.formTitle = 'Partner külső beszállítás hajóba';

                            if ($scope.order.actualServiceContract) {
                                ngivrApi.id('serviceContract', $scope.order.actualServiceContract).then(function (response) {
                                    $scope.order.selectedActualServiceContract = response.data.doc;
                                });
                            }
                        }
                        else {
                            if ($scope.mode == null) {
                                ngivrGrowl('Nem azonosítható a dispó típusa');
                            }
                        }
                    }
                }

                /**
                 * Sorszám kiosztása
                 */
                $scope.setNumber = async (type) => {
                    let year = new Date().getFullYear().toString().slice(-2); //évszám a sorszámban
                    if (year > 17) {
                        let response = await $http.get('/api/counters/' + type + '_' + year);
                        return type + year + '/' + Common.formatNumberLength(response.data.counter, 5);
                    } else {
                        let response = await $http.get('/api/counters/' + type);
                        return type + year + '/' + Common.formatNumberLength(response.data.counter, 5);
                    }
                };

                /**
                 * Chips-ben megadott rendszámok átalakítása nagybetűsre
                 */
                $scope.capitalizeChips = () => {
                    for (let i in $scope.order.allowedPlateNumbers) {
                        $scope.order.allowedPlateNumbers[i] = $scope.order.allowedPlateNumbers[i].toUpperCase()
                    }
                };

                $scope.isShipOnType = () => {
                    return $scope.order.shipOnType === 'sht' ||
                        $scope.order.shipOnType === 'pht' ||
                        $scope.order.shipOnType === 'pkb' ||
                        $scope.order.shipOnType === 'intShip'
                };

                /**
                 * Raktár választó gomb aktív-inaktív állaotát
                 * állítja be
                 * @type {{selectDepot: function()}}
                 */
                $scope.isDisabled = {
                    selectDepot: () => {
                        return !$scope.order.loadLocation[0] || !$scope.order.partner[0] || (!$scope.order.selectedSourceServiceContract && !$scope.order.sygnus) || !$scope.order.orderProduct[0] || !$scope.edited.order
                    }
                };

                /**
                 * EKÁER címadatok beállítása
                 * @param partner
                 * @returns {string}
                 */
                $scope.setAddress = (partner) => {
                    return partner.address.country.code + '-' + partner.address.zipCode.zipCode + ' ' +
                        partner.address.city + ((partner.address.address !== '' && partner.address.address
                            !== undefined) ? ', ' : '') + partner.address.address
                };

                /**
                 * Beállítja az orderen a termény paraméterlistáját
                 * @param params
                 */
                $scope.setProductParameters = (params) => {
                    let tmp = params.filter((o) => {
                        return o.libra
                    });
                    $scope.order.productParams = params.filter((o) => {
                        return o.libra
                    });
                    console.warn($scope.order.productParams)
                };

                /**
                 * EKÁER sellerAddress beállítása
                 */
                Object.defineProperty($scope.order, 'sellerAddress', {
                    configurable: true,
                    get: () => {
                        return $scope.order.seller ? $scope.setAddress($scope.order.seller) : null
                    },
                });

                /**
                 * EKÁER destinationAddress beállítása
                 */
                Object.defineProperty($scope.order, 'destinationAddress', {
                    configurable: true,
                    get: () => {
                        return $scope.order.destination ? $scope.setAddress($scope.order.destination) : null
                    },
                });

            };

            start()
        }
    }
});
