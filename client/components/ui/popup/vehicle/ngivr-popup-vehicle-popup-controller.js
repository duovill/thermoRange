const NgivrVehiclePopupController = function ($http, ngivrConfirm, Common, Auth, $scope, $filter, $mdDialog, ngModel, ngBuyContract, ngDepotSources, outerIdx, ngivrGrowl, cardType, unloadLocations, itks, sellContracts, dispos, index, sites, ekaer, ngivrApi, ngivrEkaer, vehicles, ngivrService, callback, reload, ngivrTicket, ngivrLock, $timeout, vehicleLockedByCheckbox, uniqueVehicle, ngivrHttp, ngivrException) {


    $scope._vehicle = undefined;
    Object.defineProperty($scope, 'vehicle', {
        configurable: true,
        frozen: true,
        get: () => {
            // console.warn('needCancel get');
            return this._vehicle;
        },
        set: (value) => {
            console.warn('vehicle set', value);
            this._vehicle = value
        }
    });

    $scope.$watch('vehicle', (newVal, oldVal) => {
        console.warn('vehicle $watch', newVal, oldVal)
    });

    const start = async () => {
        $scope.timeKeeping = false;
        $scope.ngivrEkaer = ngivrEkaer;
        $scope.ngivr = ngivrService;
        $scope.buyContract = ngBuyContract;
        $scope.depotSources = ngDepotSources;
        $scope.outerIdx = outerIdx;
        $scope.cardType = cardType;
        $scope.unloadLocations = unloadLocations;
        $scope.itks = itks;
        $scope.sellContracts = sellContracts;
        $scope.dispos = dispos;
        $scope.index = index;
        $scope.sites = sites;
        $scope.ekaer = ekaer;
        $scope.vehicles = vehicles;
        $scope.uniqueVehicle = uniqueVehicle;
        $scope.disposForSelect = [];
        $scope.defaultVehicle = {
            plateNumber1: null,
            plateNumber2: null,
            country1: null,
            country2: null,
            unloadedWeight: null,
            tcnUsed: false,
            edited: true,
            loadedWeight: null,
            loadDate: null,
            arrivalDate: null,
            carrier: null,
            ticketName: null,
            ticketNames: []
        };
        $scope.isNew = false;
        $scope.callback = callback;
        $scope.reload = reload;
        $scope.progressActivated = false;
        $scope.isClosed = false;
        $scope.isUpdateWeightEdit = false;
        $scope.sellContracts = sellContracts;
        //const thisFormIndex = ngivr.nextId();
        $scope.closePopup = () => {
            $scope.vehicle.needCancel = false;
            $scope.hide()
        };

        if ($scope.buyContract.sellContractId) {
            $scope.sellContract = $scope.sellContracts.filter((o) => {
                return o._id === $scope.buyContract.sellContractId
            })[0];
        }

        //const formLog = () => `Id: ${thisFormIndex}`;

        //if ($scope.ngModel && $scope.ngModel._id) {

        //}
        $scope.subscribe('popupLedger', (isSplit) => {
            $scope.isSplit = isSplit
        });

        $scope.subscribe('closePopup', () => {
            $scope.vehicle.needCancel = false;
            $scope.hide()
        });


        $scope.setDepot = function () {
            let depotId = 0;

            if ($scope.buyContract.relatedContract) {
                if ($scope.buyContract.relatedContract[0].buy) {
                    if ($scope.buyContract.unloadDepot.length > 0 && $scope.buyContract.unloadDepot[0] != null) {
                        depotId = $scope.buyContract.unloadDepot[0]._id;
                    }
                }
                else {
                    if ($scope.buyContract.loadDepot.length > 0 && $scope.buyContract.loadDepot[0] != null) {
                        depotId = $scope.buyContract.loadDepot[0].depot;
                    }
                }
            }

            if (depotId !== 0) {
                ngivrApi.id('depot', depotId).then(function (response) {
                    console.log(response);
                    $scope.vehicle.depotFull = response.data.doc
                })
            }

            if ($scope.buyContract.direction === 'internal') {
                if ($scope.buyContract.loadDepot.length > 0) {
                    depotId = $scope.buyContract.loadDepot[0].depot;
                    ngivrApi.id('depot', depotId).then(function (response) {
                        $scope.vehicle.loadDepot = [];
                        $scope.vehicle.loadDepot.push(response.data.doc);
                    })
                }
                if ($scope.buyContract.unloadDepot.length > 0) {
                    depotId = $scope.buyContract.unloadDepot[0]._id;
                    ngivrApi.id('depot', depotId).then(function (response) {
                        $scope.vehicle.unloadDepot = [];
                        $scope.vehicle.unloadDepot.push(response.data.doc);
                        $scope.vehicle.depotFull = response.data.doc
                    })
                }
            }
        };

        $scope.setDispos = function () {
            let conditions = [];
            for (let i in $scope.dispos) {
                conditions.push({_id: $scope.dispos[i].orderId})
            }
            let query = {
                limit: 0,
                search: {deleted: false, $or: conditions}
            };

            ngivrApi.query('order', query).then(function (response) {
                $scope.disposForSelect = response.data.docs;
            })
        };

        const decorateVehicle = (vehicle) => {
            vehicle._needCancel = vehicle.needCancel;
            Object.defineProperty(vehicle, 'needCancel', {
                configurable: true,
                get: () => {
                    // console.warn('needCancel get');
                    return this._needCancel;
                },
                set: (value) => {
                    console.warn('needCancel set', value);
                    this._needCancel = value
                }
            });
        };


        if (ngModel === undefined) {
            $scope.vehicle = angular.copy($scope.defaultVehicle);
            decorateVehicle($scope.vehicle);
            $scope.originalVehicle = angular.copy($scope.defaultVehicle);
            $scope.isNew = true;
            if (ekaer) {
                $scope.vehicle.loadedWeight = ngBuyContract.quantity;
            }
            $scope.setDepot();
        }
        else {
            $scope.vehicle = angular.copy(ngModel);
            decorateVehicle($scope.vehicle);
            $scope.originalVehicle = angular.copy($scope.vehicle);


            if ($scope.vehicle.carrier !== undefined && $scope.vehicle.carrier !== null) {
                if ($scope.vehicle.carrier.name === $scope.ngivr.strings.notSelected && $scope.vehicle.plateNumber1 !== null) {
                    ngivrApi.query('financialCostBearer', {search: {name: $scope.vehicle.plateNumber1}}).then((response) => {
                        $scope.vehicle.plateNumber1Full = response.data.docs[0]
                    })
                }

                if ($scope.vehicle.carrier.name === $scope.ngivr.strings.notSelected && $scope.vehicle.plateNumber2 !== null) {
                    ngivrApi.query('financialCostBearer', {search: {name: $scope.vehicle.plateNumber2}}).then((response) => {
                        $scope.vehicle.plateNumber2Full = response.data.docs[0]
                    })
                }
            }
            else
                $scope.vehicle.carrier = [];

            if ($scope.buyContract.direction === 'internal') {
                if ($scope.vehicle.loadDepot.length === 0) {
                    $scope.setDepot();
                }
                if ($scope.vehicle.unloadDepot.length === 0) {
                    $scope.setDepot();
                }
                if ($scope.vehicle.hasOwnProperty('depot') && $scope.vehicle.depot.hasOwnProperty('depotId')) {
                    ngivrApi.id('depot', $scope.vehicle.depot.depotId).then(function (response) {
                        console.log(response);
                        $scope.vehicle.depotFull = response.data.doc
                    })
                }
                else {
                    $scope.vehicle.depotFull = $scope.vehicle.unloadDepot[0];
                }
            }
            else {
                if ($scope.vehicle.hasOwnProperty('depot') && $scope.vehicle.depot.hasOwnProperty('depotId')) {
                    ngivrApi.id('depot', $scope.vehicle.depot.depotId).then(function (response) {
                        console.log(response);
                        $scope.vehicle.depotFull = response.data.doc
                    })
                }
                else {
                    $scope.setDepot();
                }
            }
        }

        $scope.isClosed = $scope.vehicle.tcnStatus === 'F' || ($scope.vehicle.inTicket && $scope.vehicle.outTicket);

        $scope.vehicle.needCancel = false;
        $scope.$watch('vehicle.plateNumber1Full', (value) => {
            if (value === undefined) return;

            if (value == null) {
                $scope.vehicle.plateNumber1 = "";
            }
            else {
                $scope.vehicle.plateNumber1 = value.name;
            }
        });
        $scope.$watch('vehicle.plateNumber2Full', (value) => {
            if (value === undefined) return;

            if (value == null) {
                $scope.vehicle.plateNumber2 = "";
            }
            else {
                $scope.vehicle.plateNumber2 = value.name;
            }
        });

        const setNeedCancel = (name) => {
            //console.warn('vehicle needCance funkcio', name);
            if (name === 'arrivalDate'
                && ($scope.vehicle.arrivalDate === null || $scope.vehicle.arrivalDate === undefined)
                && ($scope.originalVehicle.arrivalDate === null || $scope.originalVehicle.arrivalDate === undefined)) {
                return
            }
            $scope.vehicle.needCancel = true
        };
        $scope.setNeedCancel = setNeedCancel;

        $scope.$watch('vehicle.plateNumber1', (value) => {
            if ($scope.originalVehicle.plateNumber1 === value) return;

            setNeedCancel();
        });
        $scope.$watch('vehicle.plateNumber2', (value) => {
            if ($scope.originalVehicle.plateNumber2 === value) return;

            setNeedCancel();
        });
        $scope.$watch('vehicle.country1', (value) => {
            if ($scope.originalVehicle.country1 === value) return;

            setNeedCancel();
        });
        $scope.$watch('vehicle.country2', (value) => {
            if ($scope.originalVehicle.country2 === value) return;

            setNeedCancel();
        });

        $scope.$watch('vehicle.needCancel', (value) => {
            console.warn('needCancel', value)
        });

        // $scope.$watch('vehicle.loadDate', (value, oldValue) => {
        //   if (value != null) {
        //     value = new Date(value);
        //   }
        //   if ($scope.originalVehicle.loadDate != null) {
        //     $scope.originalVehicle.loadDate = new Date($scope.originalVehicle.loadDate);
        //   }
        //
        //   if ($scope.originalVehicle.loadDate.getTime() == value.getTime()) return;
        //
        //   setNeedCancel();
        // });
        $scope.$watch('vehicle.loadedWeight', (value) => {
            if ($scope.originalVehicle.loadedWeight === value) return;

            setNeedCancel();
        });
        // $scope.$watch('vehicle.arrivalDate', (value, oldValue) => {
        //   if (value != null) {
        //     value = new Date(value);
        //   }
        //   if ($scope.originalVehicle.arrivalDate != null) {
        //     $scope.originalVehicle.arrivalDate = new Date($scope.originalVehicle.arrivalDate);
        //   }
        //
        //   if ($scope.originalVehicle.arrivalDate.getTime() == value.getTime()) return;
        //
        //   setNeedCancel();
        // });
        $scope.$watch('vehicle.unloadedWeight', (value) => {
            if ($scope.originalVehicle.unloadedWeight === value) return;

            setNeedCancel();
        });

        $http.get('api/carrier').then(function (carriers) //szállítmányozók tömb feltöltése
        {
            $scope.carriers = carriers.data;
            socket.syncUpdates($scope, 'carrier');
        });

        if ($scope.buyContract.parityId) {
            let response = await $http.get('/api/paritys/' + $scope.buyContract.parityId);
            let value = response.data;
            $scope.loadLocationReq = value.transCostBuy === undefined && value.transCostSell === undefined ? false : (value.transCostBuy === undefined ? value.transCostSell : value.transCostSell);
        }

        $scope.getTicketData = async function () {
            if ($scope.vehicle.inTicket) {
                let query = {
                    deleted: false,
                    subTicketName: $scope.vehicle.inTicket
                };

                let response = await $http.get('/api/tickets/', {params: query});
                $scope.inTicket = response.data[0];
            }

            if ($scope.vehicle.outTicket) {
                let query = {
                    deleted: false,
                    subTicketName: $scope.vehicle.outTicket
                };

                let response = await $http.get('/api/tickets/', {params: query});
                $scope.outTicket = response.data[0];
            }
        };
        await $scope.getTicketData();


        /**
         * Itt kapja meg a vehicle azt a súlyadatot, amellyel a módosítást/lezárást küldjük
         * @returns {Promise<void>}
         */
        $scope.getTCNData = async function () {
            try {
                if ($scope.vehicle.tcn) { // ha van ekaer szám
                    if ($scope.vehicle.tcnStatus !== 'F') { // ha még nincs lezárva az ekaer
                        if ($scope.vehicle.inTicket || $scope.vehicle.outTicket) { //ha már van ticket, esélyes, hogy van megosztás is
                            //if ($scope.vehicle.tcn) {
                            let query = {
                                deleted: false,
                                tcn: $scope.vehicle.tcn
                            };

                            let response = await $http.get('/api/orderVehicles/', {params: query});
                            //$scope.vehicle.nettoWeight = 0;
                            let nettoWeight = 0;

                            for (let i in response.data) {
                                if (response.data[i]._id === $scope.vehicle._id) { // ha a lekért vehicle megegyezik a felületen betöltöttel, akkor nem a db értékét használjuk
                                    if ($scope.vehicle.unloadedWeight) {
                                        nettoWeight += $scope.vehicle.unloadedWeight;
                                    } else {
                                        nettoWeight += $scope.vehicle.loadedWeight;
                                    }
                                } else {
                                    if (response.data[i].unloadedWeight) {
                                        nettoWeight += response.data[i].unloadedWeight;
                                    } else {
                                        nettoWeight += response.data[i].loadedWeight;
                                    }
                                }
                            }
                            $scope.vehicle.nettoWeight = Number(nettoWeight.toFixed(3));
                            //}
                        } else {
                            if ($scope.vehicle.unloadedWeight) {
                                $scope.vehicle.nettoWeight = Number($scope.vehicle.unloadedWeight.toFixed(3));
                            } else {
                                $scope.vehicle.nettoWeight = Number($scope.vehicle.loadedWeight.toFixed(3));
                            }
                        }
                    } else { // ha már le van zárva az ekaer, akkor az ekaer súlyt szerepeltetjük ekaer-súlyként
                        const response = await ngivrHttp.get('/api/ekaers/lastTcn/' + $scope.vehicle.tcn);
                        $scope.vehicle.nettoWeight = parseFloat((response.data.totalWeight / 1000).toFixed(3))
                    }

                }
            } catch (e) {
                ngivrException.handler(e);
            }


        };

        await $scope.getTCNData();

        $scope.getWeight = (param) => {
            switch (param) {
                case 'max':
                    let max = Infinity;
                    if ($scope.vehicle.tcnStatus === 'F') {
                        max = $scope.vehicle.nettoWeight * 1.1
                    }
                    return max;
                case 'min':
                    let min = 0;
                    if ($scope.vehicle.tcnStatus === 'F') {
                        min = $scope.vehicle.nettoWeight * 0.9
                    }
                    return min
            }

        };

        $scope.showVehiclePopup = function () {
            $scope.reLoadVehicle();
            //$mdDialog.hide();
            //$timeout(function () {
            //     $scope.reLoadVehicle(function () {
            //         return $scope.reload();
            //     });
            //}, 1000)
        };

        $scope.hide = function () {

            if ($scope.vehicle.needCancel) {
                ngivrConfirm('Biztosan bezárja? A nem mentett adatok el fognak veszni.', undefined, null, null, true)
                    .then(function () {
                        $scope.vehicle = angular.copy($scope.originalVehicle);
                        $mdDialog.hide();
                    })
            }
            else {
                $scope.vehicle = angular.copy($scope.originalVehicle);
                $mdDialog.hide();
            }
        };

        $scope.cancel = function () {
            $scope.reLoadVehicle();
        };

        $scope.answer = function (options = {}) {
            const {autoUnlock} = options;
            if ($scope.vehicle.needCancel && autoUnlock !== true) {
                ngivrConfirm('Biztosan bezárja? A nem mentett adatok el fognak veszni.', undefined, null, null, true)
                    .then(function () {
                        $mdDialog.hide();
                    })
            }
            else {
                $mdDialog.hide();
            }
            //$mdDialog.cancel();
        };

        $scope.saveVehicle = async function (notClose, cb, ismodifyTcn, checkDb = true) {
            let isSame = true;
            if (checkDb) {
                isSame = await $scope.checkDbAndClientIsSame()
            }

            if (!isSame) {
                return
            }

            if ($scope.uniqueVehicle && $scope.buyContract.ownScale) {
                $scope.vehicle.uniqueVehicle = true
            }

            if ($scope.vehicle.depotFull) {
                $scope.vehicle.depot = {depotId: $scope.vehicle.depotFull._id, depotName: $scope.vehicle.depotFull.name}
            }

            if ($scope.vehicle.loadedWeight) {
                $scope.vehicle.loadedWeight = Number($scope.vehicle.loadedWeight.toFixed(3));
            }
            if ($scope.vehicle.unloadedWeight) {
                $scope.vehicle.unloadedWeight = Number($scope.vehicle.unloadedWeight.toFixed(3));
            }

            if ($scope.vehicle.arrivalDate !== undefined) {
                $scope.vehicle.arrivalDate = new Date($scope.vehicle.arrivalDate);
            }

            $scope.vehicle.loadDate = new Date($scope.vehicle.loadDate);
            $scope.vehicle.country1 = $scope.vehicle.country1 === undefined ? null : $scope.vehicle.country1;
            $scope.vehicle.country2 = $scope.vehicle.country2 === undefined ? null : $scope.vehicle.country2;

            if ($scope.isNew || $scope.vehicle._id === undefined) { //ha nem elmentett járművet módosítottunk
                $scope.vehicle.orderId = $scope.buyContract._id;
                $http.post('/api/orderVehicles/', $scope.vehicle).then(function (response) {

                    if ($scope.vehicle.isOwnVehicle) {
                        $scope.plateNumber1Full = $scope.vehicle.plateNumber1Full;
                        $scope.plateNumber2Full = $scope.vehicle.plateNumber2Full;
                    }

                    $scope.vehicle = response.data;
                    $scope.isNew = false;

                    if ($scope.vehicle.isOwnVehicle) {
                        $scope.vehicle.plateNumber1Full = $scope.plateNumber1Full;
                        $scope.vehicle.plateNumber2Full = $scope.plateNumber2Full;
                    }

                    End();
                });
            }
            else {
                delete $scope.vehicle.__v;
                $http.put('/api/orderVehicles/' + $scope.vehicle._id, $scope.vehicle).then(function () {
                    End();
                });
            }

            function End() {

                $scope.isClosed = $scope.vehicle.tcnStatus === 'F' || ($scope.vehicle.inTicket && $scope.vehicle.outTicket);

                $scope.originalVehicle = angular.copy($scope.vehicle);
                /*
                                ezt majd ki kell commentelni, csak akkor kell, ha localban az éles db-t mókoljuk, mert módosítja az ekaer számokat

                                if (!notClose) $mdDialog.hide();
                                if (cb) {
                                    return cb();
                                }
                */
                if ($scope.vehicle.tcn && $scope.vehicle.tcnStatus !== 'F' && !ismodifyTcn) {
                    $scope.getTCNData();
                    $scope.modifyTcn(false, function () {
                        $scope.originalVehicle = angular.copy($scope.vehicle);
                        $scope.vehicle.needCancel = false;
                        //ngivrGrowl('save');
                        $scope.publish('vehiclelistupdated');
                        if (!notClose) $mdDialog.hide();

                        if (cb) {
                            return cb();
                        }
                    });
                }
                else {
                    $scope.vehicle.needCancel = false;
                    $scope.originalVehicle = angular.copy($scope.vehicle);
                    //ngivrGrowl('save');
                    $scope.publish('vehiclelistupdated');
                    if (!notClose) $mdDialog.hide();

                    if (cb) {
                        return cb();
                    }
                }
            }
        };

        //súlymegosztás mező megjelenítése
        $scope.splitWeight = function (direction) {

            if ($scope.vehicle.tcnStatus === 'F' ? true : false) return;

            switch (direction) {
                case 'in':
                    if (!$scope.vehicle.hasOwnProperty('splittedLoadedWeights')) {
                        $scope.vehicle.splittedLoadedWeights = [];
                    }
                    $scope.vehicle.splittedLoadedWeights.push({contractNumber: null, contractId: null, weight: null});
                    break;
                case 'out':
                    if (!$scope.vehicle.hasOwnProperty('splittedUnloadedWeights')) {
                        $scope.vehicle.splittedUnloadedWeights = []
                    }
                    $scope.vehicle.splittedUnloadedWeights.push({contractNumber: null, contractId: null, weight: null})
            }

        };

        $scope.removeSplit = function (direction, idx) {
            switch (direction) {
                case 'in':
                    $scope.vehicle.splittedLoadedWeights.splice(idx, 1);
                    break;
                case 'out':
                    $scope.vehicle.splittedUnloadedWeights.splice(idx, 1);
            }
        };

        $scope.checkunloadedWeight = function () {
            // if ($scope.vehicles.filter(function (a) {
            //     return a.orderId === $scope.buyContract.orderId;
            //   })[idx] === undefined) {
            //   return true
            // }

            if ($scope.vehicle.splittedUnloadedWeights === undefined) {
                return true;
            }

            if ($scope.vehicle.splittedUnloadedWeights.length > 0) {
                let sumweight = 0;
                for (let i in $scope.vehicle.splittedUnloadedWeights) {
                    sumweight += $scope.vehicle.splittedUnloadedWeights[i].weight;
                }

                return sumweight === $scope.vehicle.unloadedWeight;
            }
            else
                return true;
        };

        $scope.checkloadedWeight = function () {
            // if ($scope.vehicle === undefined) {
            //   return true
            // }

            if ($scope.vehicle.splittedLoadedWeights === undefined) {
                return true;
            }

            if ($scope.vehicle.splittedLoadedWeights.length > 0) {
                let sumweight = 0;
                for (let i in $scope.vehicle.splittedLoadedWeights) {
                    sumweight += $scope.vehicle.splittedLoadedWeights[i].weight;
                }

                return sumweight === $scope.vehicle.loadedWeight;
            }
            else
                return true;
        };

        $scope.sendOutTicket = async function () //ticket küldése
        {
            if (!$scope.ngivr.form.validate($scope.vehiclePopupForm)) {
                throw new Error("Sikertelen form validáció");
            }
            let send, save;

            let isSame = await $scope.checkDbAndClientIsSame();

            if (!isSame) {
                return
            }

            $scope.progressActivated = true;
            if ($scope.timeKeeping) send = new Date();
            ngivrTicket.sendRuralTourOutTicket($scope.buyContract, $scope.vehicle, function () {
                if ($scope.timeKeeping) {
                    send = new Date() - send;

                    alert('Ticket küldése: ' + send + ' ms');
                    save = new Date()
                }
                $scope.saveVehicle(true, function () {
                    if ($scope.timeKeeping) {
                        save = new Date() - save;
                        alert('Vehicle mentése: ' + save + ' ms');
                    }
                    $scope.getTicketData();
                    $scope.progressActivated = false;
                });
            })
        };

        $scope.sendInTicket = async function () //ticket küldése
        {
            if (!$scope.ngivr.form.validate($scope.vehiclePopupForm)) {
                throw new Error("Sikertelen form validáció");
            }
            let send, save;

            let isSame = await $scope.checkDbAndClientIsSame();

            if (!isSame) {
                return
            }

            $scope.progressActivated = true;
            if ($scope.timeKeeping) send = new Date();
            ngivrTicket.sendRuralTourInTicket($scope.buyContract, $scope.vehicle, function () {  // a$đcope.buyContract-ban order van
                if ($scope.timeKeeping) {
                    send = new Date() - send;

                    alert('Ticket küldése: ' + send + ' ms');
                    save = new Date();
                }
                $scope.saveVehicle(true, function () {
                    if ($scope.timeKeeping) {
                        save = new Date() - save;
                        alert('Vehicle mentése: ' + save + ' ms');
                    }

                    $scope.getTicketData();
                    $scope.progressActivated = false;
                });
            })
        };

        /**
         * Járműsorokban ekaer adatok megjelenítése
         */
        $scope.showEkaer = function () {

            try {
                return $scope.vehicle.ekaer;
            }
            catch (err) {

            }
        };

        $scope.isBlank = function (str) {
            return (!str || /^\s*$/.test(str));
        };

        /**
         * Ticket beküldése
         */
        $scope.sendNewTicketForVehicleAndDispo = async function (direction) {
            if (!$scope.ngivr.form.validate($scope.vehiclePopupForm)) {
                throw new Error("Sikertelen form validáció");
            }

            let isSame = await $scope.checkDbAndClientIsSame();

            if (!isSame) {
                return
            }

            $scope.progressActivated = true;
            ngivrTicket.sendNewTicketForVehicleAndDispo($scope.buyContract, $scope.vehicle, direction, function () {
                $scope.saveVehicle(true, function () {
                    $scope.getTicketData();
                    $scope.progressActivated = false;
                });
            })
        };

        /**
         * Inaktív gombok beállítása
         * @type {{sendTicket: (())}}
         */
        $scope.isDisabled = {
            sendOrderTicket: () => {
                if ($scope.buyContract.direction === 'in') {
                    return $scope.vehicle === undefined
                        || $scope.vehicle.plateNumber1 === null
                        || $scope.vehicle.plateNumber1 === ''
                        || ($scope.vehicle.country1 === null && $scope.buyContract.ekaer && $scope.vehicle.isOwnVehicle === false)
                        || ($scope.vehicle.country1 === undefined && $scope.buyContract.ekaer && $scope.vehicle.isOwnVehicle === false)
                        || $scope.vehicle.loadedWeight === null
                        || $scope.vehicle.unloadedWeight === null
                        || $scope.vehicle.loadDate === null
                        || $scope.vehicle.arrivalDate === null
                        //|| ($scope.buyContract.ekaer ? (!$scope.vehicle.tcn || $scope.vehicle.tcnStatus !== 'F') : false)
                        //|| ($scope.buyContract.ekaer ? (!$scope.vehicle.tcn) : false)
                }
                else {
                    return $scope.vehicle === undefined
                        || $scope.vehicle.plateNumber1 === null
                        || $scope.vehicle.plateNumber1 === ''
                        || ($scope.vehicle.country1 === null && $scope.buyContract.ekaer && $scope.vehicle.isOwnVehicle === false)
                        || ($scope.vehicle.country1 === undefined && $scope.buyContract.ekaer && $scope.vehicle.isOwnVehicle === false)
                        || $scope.vehicle.loadedWeight === null
                        || $scope.vehicle.unloadedWeight === null
                        || $scope.vehicle.loadDate === null
                        || $scope.vehicle.arrivalDate === null
                        //|| ($scope.buyContract.ekaer ? (!$scope.vehicle.tcn || $scope.vehicle.tcnStatus !== 'F') : false)
                        //|| ($scope.buyContract.ekaer ? (!$scope.vehicle.tcn) : false)
                }
            },
            sendRuralTourTicket: () => {
                if ($scope.vehicle.inTicket === undefined) {
                    return $scope.vehicle === undefined
                        || (!$scope.vehicle.loadedWeight ? $scope.buyContract.relatedContract[0].parity[0].transCostBuy === true : false)
                        //|| !$scope.buyContract.relatedContract[0].parity[0].transCostBuy ? false  !$scope.vehicle.loadedWeight
                        || !$scope.vehicle.loadDate
                        //|| !$scope.vehicle.arrivalDate
                        || !$scope.vehicle.plateNumber1
                        || ($scope.buyContract.ekaer ? !$scope.vehicle.country1 : false)
                    //|| ($scope.buyContract.ekaer ? (!$scope.vehicle.tcn || $scope.vehicle.tcnStatus !== 'F') : false)
                    //|| ($scope.buyContract.ekaer ? (!$scope.vehicle.tcn) : false)
                }
                else {
                    return $scope.vehicle === undefined
                        || $scope.vehicle.plateNumber1 === null
                        || $scope.vehicle.plateNumber1 === ''
                        || ($scope.vehicle.country1 === null && $scope.buyContract.ekaer && $scope.vehicle.isOwnVehicle === false)
                        || ($scope.vehicle.country1 === undefined && $scope.buyContract.ekaer && $scope.vehicle.isOwnVehicle === false)
                        || $scope.vehicle.loadedWeight === null
                        || $scope.vehicle.unloadedWeight === null
                        || !$scope.vehicle.loadDate
                        || !$scope.isValidDate($scope.vehicle.arrivalDate)
                        //|| ($scope.buyContract.ekaer ? (!$scope.vehicle.tcn || $scope.vehicle.tcnStatus !== 'F') : false)
                        //|| ($scope.buyContract.ekaer ? (!$scope.vehicle.tcn) : false)
                        || $scope.vehicle.outTicket
                }
            },
            finalizeTcn: () => {
                return $scope.vehicle === undefined || !$scope.vehicle.tcn ||
                    !$scope.vehicle.arrivalDate ||
                    $scope.vehicle.plateNumber1 === null ||
                    $scope.vehicle.country1 === null ||
                    $scope.vehicle.loadedWeight === null ||
                    $scope.vehicle.unloadedWeight === null ||
                    //$scope.vehicle.unloadedWeight === null ||
                    $scope.vehicle.tcnStatus === 'I' ||
                    $scope.vehicle.tcnStatus === 'F' ||
                    ($scope.loadLocationReq === true ? ($scope.vehicle.loadDate === undefined || $scope.vehicle.loadDate === null) : false) ||
                    ($scope.buyContract.tradeType === 'E' ? $scope.vehicle.loadDate === null : false) ||
                    ($scope.buyContract.tradeType !== 'E' ? $scope.vehicle.arrivalDate === null : false)

            },
            modifyTcn: () => {
                return $scope.vehicle === undefined || !$scope.vehicle.tcn ||
                    $scope.vehicle.tcnStatus === 'I' ||
                    $scope.vehicle.tcnStatus === 'F' ||
                    ($scope.buyContract.tradeType === 'E' ? $scope.vehicle.loadDate === null : false) ||
                    ($scope.buyContract.tradeType !== 'E' ? $scope.vehicle.arrivalDate === null : false)

            },
            createTcn: () => {
                return $scope.vehicle.tcn || (!$scope.vehicle.tcn && ($scope.vehicle.inTicket || $scope.vehicle.outTicket))
            },
        };

        $scope.isValidDate = (d) => {
            return d instanceof Date && !isNaN(d);
        };

        $scope.setContractId = function (index, direction, order) {
            ngivrService.api.id('contract', order.contractId).then(function (response) {
                let contract = response.data.doc;

                switch (direction) {
                    case 'in':
                        $scope.vehicle.splittedLoadedWeights[index].contractId = order.contractId;
                        $scope.vehicle.splittedLoadedWeights[index].contractNumber = contract.contractNumber;
                        $scope.vehicle.splittedLoadedWeights[index].orderNumber = order.orderNumber;
                        break;
                    case 'out':
                        $scope.vehicle.splittedUnloadedWeights[index].contractId = order.contractId;
                        $scope.vehicle.splittedUnloadedWeights[index].contractNumber = contract.contractNumber;
                        $scope.vehicle.splittedUnloadedWeights[index].orderNumber = order.orderNumber;
                        break;
                }
            })
        };

        /**
         * Rendszámadatok visszaállítása
         */
        $scope.resetPlateNumbers = () => {
            $scope.vehicle.plateNumber1Full = null;
            $scope.vehicle.plateNumber1 = null;
            $scope.vehicle.country1 = null;
            $scope.vehicle.plateNumber2Full = null;
            $scope.vehicle.plateNumber2 = null;
            $scope.vehicle.country2 = null;
        };

        $scope.createNewTcn = async () => {
            if (!$scope.ngivr.form.validate($scope.vehiclePopupForm)) {
                throw new Error("Sikertelen form validáció");
            }

            if ($scope.vehicle.loadDate > $scope.vehicle.arrivalDate) {
                ngivrGrowl('Nem lehet kisebb a lerakás dátuma mint a felrakás dátuma');
                return;
            }

            let isSame = await $scope.checkDbAndClientIsSame();

            if (!isSame) {
                return
            }

            try {
                $scope.progressActivated = true;
                ngivrEkaer.createTcn([$scope.vehicle], $scope.buyContract, async (response) => {

                    if (response.vehicles && response.vehicles.length) {
                        for (let i in response.vehicles) {
                            ngivrService.growl('EKÁER igénylés sikertelen. Hiba: ' + response.vehicles[i].ekaerError);
                        }
                        $scope.progressActivated = false;
                        return
                    }

                    if (response.globalError) {
                        ngivrService.growl('EKÁER igénylés sikertelen. Hiba: ' + response.globalError);
                        $scope.progressActivated = false;
                        return
                    }
                    // ngivrApi.id('vehicle', $scope.vehicle._id).then(function (response) {
                    //   $scope.vehicle = response.data.doc;
                    // });

                    await $scope.saveVehicle(true, null, true, false);
                    $scope.progressActivated = false;
                })
            }
            catch (err) {
                ngivrGrowl(err.message);
                $scope.progressActivated = false;
            }
        };

        $scope.finalizeTcn = async () => {
            if (!$scope.ngivr.form.validate($scope.vehiclePopupForm)) {
                throw new Error("Sikertelen form validáció");
            }

            if ($scope.vehicle.loadDate > $scope.vehicle.arrivalDate) {
                ngivrGrowl('Nem lehet kissebb a lerakás dátuma mint a felrakás dátuma');
                return;
            }

            let isSame = await $scope.checkDbAndClientIsSame();

            if (!isSame) {
                return
            }

            try {
                $scope.progressActivated = true;
                $scope.modifyTcn(false, function () {
                    $scope.saveVehicle(true, function () {
                        $scope.getTCNData();
                        ngivrEkaer.finalizeTcn([$scope.vehicle], $scope.buyContract, function (response) {
                            if (response.vehicles && response.vehicles.length) {
                                for (let i in response.vehicles) {
                                    ngivrService.growl('EKÁER véglegesítés sikertelen. Hiba: ' + response.vehicles[i].ekaerError);
                                }
                                $scope.progressActivated = false;
                                return
                            }
                            if (response.globalError) {
                                ngivrService.growl('EKÁER véglegesítés sikertelen. Hiba: ' + response.globalError);
                                $scope.progressActivated = false;
                                return
                            }

                            $scope.originalVehicle = angular.copy($scope.vehicle);
                            $scope.saveVehicle(true);
                            $scope.progressActivated = false;
                        })
                    })
                })
            }
            catch (err) {
                ngivrGrowl(err.message);
                $scope.progressActivated = false;
            }
        };

        $scope.modifyTcn = async (showGrowl, cb) => {
            if (!$scope.ngivr.form.validate($scope.vehiclePopupForm)) {
                throw new Error("Sikertelen form validáció");
            }

            if ($scope.vehicle.loadDate > $scope.vehicle.arrivalDate) {
                ngivrGrowl('Nem lehet kissebb a lerakás dátuma mint a felrakás dátuma');
                return;
            }

            let isSame = await $scope.checkDbAndClientIsSame();

            if (!isSame) {
                return
            }

            try {
                $scope.progressActivated = true;
                await $scope.getTCNData();
                ngivrEkaer.modifyTcn($scope.vehicle, $scope.buyContract, showGrowl, async function (response) {
                    if (response.vehicles && response.vehicles.length) {
                        for (let i in response.vehicles) {
                            ngivrService.growl('EKÁER módosítás sikertelen. Hiba: ' + response.vehicles[i].ekaerError);
                        }
                        $scope.progressActivated = false;
                        return
                    }
                    if (response.globalError) {
                        ngivrService.growl('EKÁER módosítás sikertelen. Hiba: ' + response.globalError);
                        $scope.progressActivated = false;
                        return
                    }

                    $scope.originalVehicle = angular.copy($scope.vehicle);
                    await $scope.saveUpdateWeight({notSaveVehicle: true});
                    await $scope.saveVehicle(true, undefined, true);

                    $scope.progressActivated = false;

                    if (cb) {
                        return cb();
                    }
                });
            }
            catch (err) {
                ngivrGrowl(err.message);
                $scope.progressActivated = false;
            }
        };


        $scope.reLoadVehicle = function (cb) {
            ngivrApi.id('orderVehicle', $scope.vehicle._id).then(function (response) {
                $scope.vehicle = angular.copy(Object.assign(response.data.doc, {
                    nettoWeight: $scope.vehicle.nettoWeight,
                    splitWeight: $scope.vehicle.splitWeight,
                    splitWeightRuralOut: $scope.vehicle.splitWeightRuralOut
                }));
                $scope.originalVehicle = angular.copy(response.data.doc);

                if ($scope.vehicle.carrier) {
                    $scope.vehicle.carrier = $scope.carriers.filter(function (obj) {
                        return obj._id === $scope.vehicle.carrier._id;
                    })[0];
                }


                if ($scope.vehicle.carrier) {
                    if ($scope.vehicle.carrier.name === $scope.ngivr.strings.notSelected && $scope.vehicle.plateNumber1 !== null) {
                        ngivrApi.query('financialCostBearer', {search: {name: $scope.vehicle.plateNumber1}}).then((response) => {
                            $scope.vehicle.plateNumber1Full = response.data.docs[0]
                        })
                    }

                    if ($scope.vehicle.carrier.name === $scope.ngivr.strings.notSelected && $scope.vehicle.plateNumber2 !== null) {
                        ngivrApi.query('financialCostBearer', {search: {name: $scope.vehicle.plateNumber2}}).then((response) => {
                            $scope.vehicle.plateNumber2Full = response.data.docs[0]
                        })
                    }
                }

                // if ($scope.vehicle.hasOwnProperty('depot') && $scope.vehicle.depot.hasOwnProperty('depotId')) {
                //     ngivrApi.id('depot', $scope.vehicle.depot.depotId).then(function (response) {
                //         console.log(response);
                //         $scope.vehicle.depotFull = response.data.doc
                //     })
                // }
                // else {
                //     $scope.setDepot();
                // }
                $scope.setDepot();

                if ($scope.vehicle.carrier === undefined) {
                    $scope.vehicle.carrier = {name: 'Nincs'};
                }
                $scope.originalVehicle = angular.copy($scope.vehicle);
                $scope.vehicle.needCancel = false;

                $scope.getTicketData();

                $scope.getTCNData();

                if (cb) {
                    return cb();
                }
            })
        };

        $scope.checkDbAndClientIsSame = async () => {

            if (!$scope.vehicle.hasOwnProperty('_id')) {
                return true;
            }

            let response = await ngivrApi.id('orderVehicle', $scope.vehicle._id);
            let vehicle = response.data.doc;

            if ($scope.originalVehicle.plateNumber1 !== vehicle.plateNumber1 || $scope.originalVehicle.plateNumber2 !== vehicle.plateNumber2) {

                if ($scope.vehicle.plateNumber1Full) {
                    $scope.vehicle.plateNumber1Full.name = vehicle.plateNumber1;
                }
                if ($scope.vehicle.plateNumber2Full) {
                    $scope.vehicle.plateNumber2Full.name = vehicle.plateNumber2;
                }
                $scope.vehicle.plateNumber1 = vehicle.plateNumber1;
                $scope.vehicle.country1 = vehicle.country1;
                $scope.vehicle.plateNumber2 = vehicle.plateNumber2;
                $scope.vehicle.country2 = vehicle.country2;
                $scope.originalVehicle = angular.copy(vehicle);
                ngivrGrowl('Az adatbázisban a rendszám megváltozott');
                return false;
            }

            return true;
            // })
        };

        $scope.updateUnLoadWeight = async (mode) => {
            if (!$scope.ngivr.form.validate($scope.vehiclePopupForm)) {
                throw new Error("Sikertelen form validáció");
            }

            let isSame = await $scope.checkDbAndClientIsSame();

            if (!isSame) {
                return
            }
            let ticket = null;
            let index = 0;

            switch (mode) {
                case 'in':
                    index = Common.functiontofindIndexByKeyValue($scope.inTicket.ledger, 'subTicketName', $scope.vehicle.inTicket);
                    ticket = $scope.inTicket;
                    break;

                case 'out':
                    index = Common.functiontofindIndexByKeyValue($scope.outTicket.ledger, 'subTicketName', $scope.vehicle.outTicket);
                    ticket = $scope.outTicket;
                    break;
            }

            ngivrTicket.sendUnloadedTicketUpdate(ticket, $scope.vehicle, index);
            $scope.saveVehicle(true, function () {
                $scope.getTicketData();
            });
        };

        $scope.getLedgerIndex = function (mode) {
            let index = 0;

            switch (mode) {
                case 'in':
                    if (!$scope.inTicket) return -1;
                    index = Common.functiontofindIndexByKeyValue($scope.inTicket.ledger, 'subTicketName', $scope.vehicle.inTicket);
                    break;

                case 'out':
                    if (!$scope.outTicket) return -1;
                    index = Common.functiontofindIndexByKeyValue($scope.outTicket.ledger, 'subTicketName', $scope.vehicle.outTicket);
                    break;
            }

            return index;
        };

        $scope.updateWeight = function () {
            $scope.isUpdateWeightEdit = true;
        };

        $scope.saveUpdateWeight = async function (options) {
            let {notSaveVehicle} = options;
            let index = 0;

            $scope.progressActivated = true;

            if ($scope.inTicket) {
                index = Common.functiontofindIndexByKeyValue($scope.inTicket.ledger, 'subTicketName', $scope.vehicle.inTicket);
                await ngivrTicket.updateTicketLedgerWeightByVehicleWeight($scope.inTicket, $scope.vehicle, index);
            }

            if ($scope.outTicket) {
                index = Common.functiontofindIndexByKeyValue($scope.outTicket.ledger, 'subTicketName', $scope.vehicle.outTicket);
                await ngivrTicket.updateTicketLedgerWeightByVehicleWeight($scope.outTicket, $scope.vehicle, index);
            }

            if (!notSaveVehicle) {
                await $scope.saveVehicle(true, async function () {
                    await $scope.getTicketData();
                    $scope.progressActivated = false;
                    $scope.isUpdateWeightEdit = false;
                });
            }


        };

        $scope.cancelUpdateWeight = function () {
            $scope.isUpdateWeightEdit = false;
            $scope.reLoadVehicle();
        };


        $scope.isEditable = () => {
            return $scope.isClosed
        };

        if (!vehicleLockedByCheckbox) {
            if ($scope.isEditable()) {

                //lock: updateWeight
//unlock: answer('close'), cancelUpdateWeight(), saveUpdateWeight

                $scope.lock = ngivrLock({
                    scope: $scope,
                    watchId: 'vehicle._id',
                    schema: 'orderVehicle',
                    watchEditing: 'isUpdateWeightEdit',
                    scopeDecorator: {
                        onAutoUnlockOrError: {
                            cancelFunction: async () => await $scope.cancelUpdateWeight({autoUnlock: true})
                        },
                        lock: {
                            functionName: 'updateWeight',
                        },
                        unlock: {
                            functionName: ['saveUpdateWeight', 'cancelUpdateWeight', 'answer'],
                        }
                    }
                })


            } else if ($scope.vehicle._id) {

                $scope.lock = ngivrLock({
                    scope: $scope,
                    resource: `orderVehicle:${$scope.vehicle._id}`,
                    schema: 'orderVehicle',
                    watchEditing: 'isUpdateWeightEdit',
                    scopeDecorator: {
                        onAutoUnlockOrError: {
                            cancelFunction: async () => await $scope.answer()
                        },

                        unlock: {
                            functionName: ['answer'],
                        }
                    }
                });
                $scope.lock.lock()
            }
        }


    };
    start();
};
NgivrVehiclePopupController.$inject = ['$http', 'ngivrConfirm', 'Common', 'Auth', '$scope', '$filter', '$mdDialog', 'ngModel', 'ngBuyContract', 'ngDepotSources', 'outerIdx', 'ngivrGrowl', 'cardType', 'unloadLocations', 'itks', 'sellContracts', 'dispos', 'index', 'sites', 'ekaer', 'ngivrApi', 'ngivrEkaer', 'vehicles', 'ngivrService', 'callback', 'reload', 'ngivrTicket', 'ngivrLock', '$timeout', 'vehicleLockedByCheckbox', 'uniqueVehicle', 'ngivrHttp', 'ngivrException'];
