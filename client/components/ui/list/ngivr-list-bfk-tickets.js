'use strict';
ngivr.angular.directive('ngivrListBfkTickets', ($http, $filter, socket, ngivrService, $timeout, ngivrEkaer, ngivrSocketLock, Auth, ngivrGrowl, Common, ngivrPrompt, ngivrConfirm, ngivrApi, ngivrTicketValidation, $window, ngivrLock, ngivrLockService) => {
    // let vehicleIndex = 0;
    return {
        restrict: 'E',
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-bfk-tickets.html',
        scope: {
            ngivrQuery: '=',
            dispo: '=',
            dispos: '=',
            wrongEkaer: '<',
            ngivrUrl: '<'
        },
        transclude: true,
        controller: class {

            constructor($scope) {

                //const start = async () => {

                // vehicleIndex++;
                // const thisVehicleIndex = vehicleIndex;

                this.$scope = $scope;
                $scope.cssPrefix = $scope.dispo ? $scope.dispo.bfkd ? 'vslBfkd' : 'vsl' : 'vslBfkd';
                $scope.fileName = $scope.dispo.orderNumber;
                this.$scope.catchUnlockCallbackDestroyers = [];
                this.$scope.locks = [];
                this.$scope.selected = [];
                this.$scope.redisLockList = [];
                //const redisLocks = await ngivrLockService.getAllLocks();
                //this.$scope.redisLockList = redisLocks.data;
                this.$scope.ngivrLock = ngivrLock;
                // socket.socket.on('ngivr-lock-response-get-locks', async () => {
                //   const redisLocks = await ngivrLockService.getAllLocks();
                //   this.$scope.redisLockList = redisLocks.data
                // });

                $scope.$on('$destroy', () => {
                    if (this.$scope.catchUnlockCallbackDestroyers.length) {
                        ngivr.console.log('enabled form, executing forceful destroy');
                        this.$scope.unlockVehicle();
                    }


                    // for (let subscriber of subscribers)
                    //     ngivrLockService.unsubscribe(subscriber)
                });

                let subscribers = [];


                $scope.generateCurrentResource = () => {
                    for (let i in $scope.docs) {
                        if (!$scope.docs[i].generated) {
                            $scope.docs[i].generated = true;
                            if (i == $scope.docs.length - 1) {
                                for (let i in $scope.docs) {

                                    $scope.docs[i].generated = false;


                                }
                            }
                            return {resource: 'vehicle:' + $scope.docs[i]._id, currentIndex: 1 + Number(i)}
                        }

                    }

                };


                // ha torles van, akkor igy kell hasznalni (ures lesz minden)
                $scope.$on(ngivr.settings.event.client.list.clear, () => {
                    $scope.inputSearch = undefined;
                    this.cancelTcn();
                });

                this.$id = $scope.$id;
                this.topOffset = $window.innerWidth < 1000 ? 0 : 73;

                $scope.$on(ngivr.settings.event.client.list.loaded, async (data) => {
                    //this.getPerformedAndTransportDiff(data.targetScope.query.docs);
                    $scope.docs = data.targetScope.query.docs;
                    //  $scope.setSubscribers();
                    for (let doc of data.targetScope.query.docs) {
                        // if ($scope.dispo.bfkd) { //bfk order járműjéről van szó
                        //     let resp = await ngivrApi.query('ticket', {search: {ledger: {$elemMatch: {subTicketName: doc.outTicket}}}});
                        //     doc.shipName = resp.data.docs[0].ship.name;
                        //     resp = await ngivrApi.id('ticket', resp.data.docs[0].parentTicketId);
                        //     doc.inTicketNumber = resp.data.doc.ticketName;
                        //     doc.relatedOrderNumber = resp.data.doc.ledger[0].orderNumber
                        // }
                        //doc.loadDate = $filter('date')(doc.loadDate, 'yyyy.MM.dd');
                        doc.loadedWeightFormatted = $filter('number')(doc.loadedWeight, 3);
                        doc.unloadedWeightFormatted = $filter('number')(doc.unloadedWeight, 3);
                        if (doc.loadedWeight) {
                            doc.loadedWeight = Number(doc.loadedWeight.toFixed(3));
                        }
                        if (doc.unloadedWeight) {
                            doc.unloadedWeight = Number(doc.unloadedWeight.toFixed(3));
                        }

                    }
                    this.cancelTcn();
                });


                $scope.locklist = [];

                //$scope.socketService = ngivrSocketLock;
                $scope.selected = [];
                $scope.ekaer = {
                    edited: false,
                    request: false
                };
                $scope.dispo.selectAll = false;

                $scope.isDisabled = {
                    ekaer: (dispo) => {
                        return dispo.orderClosed || dispo.deleted || !$scope.ekaer.edited
                    },
                    ekaerCheckbox: (vehicle) => {
                        return vehicle.deleted || vehicle.locked
                            || vehicle.notSelectable || vehicle.notFinalizable || vehicle.ticketDeleted
                            || vehicle.tcnStatus === 'F' || vehicle.tcnStatus === 'I' || $scope.dispo.orderClosed;
                    },
                    addVehicle: (dispo) => {
                        return dispo.ekaer ? !$scope.ekaer.edited || dispo.orderClosed || dispo.deleted : dispo.orderClosed || dispo.deleted
                    },
                    vehicleEditable: (doc) => {
                        return this.isVehicleLocked(doc)
                            || (!this.$scope.dispo.ekaer && (dispo.inTicket || dispo.outTicket) && (doc.tcnStatus === 'F' ? true : false))
                            || doc.ticketDeleted;
                    },
                    createTcn: true,
                    finalizeTcn: true,
                    deleteTcn: true
                };

                socket.socket.on(ngivr.settings.socket.event.lock.list.update, function (data) {
                    $scope.locklist = data.data;
                });

                // $scope.socketService.get();

                $scope.subscribe('vehiclelistupdated', () => {
                    this.cancelTcn();
                });

                $scope.subscribe('setlock', (options) => {
                    //      this.setLock(options);
                });

                $scope.getTCNData = async function (vehicle) {
                    if (vehicle.tcn) {
                        let query = {
                            deleted: false,
                            tcn: vehicle.tcn
                        };

                        let response = await $http.get('/api/orderVehicles/', {params: query});
                        vehicle.nettoWeight = 0;

                        for (let i in response.data) {
                            vehicle.nettoWeight += response.data[i].unloadedWeight;
                        }

                        vehicle.nettoWeight = Number(vehicle.nettoWeight.toFixed(3));

                    }
                };

                $scope.unlockVehicle = () => {

                    // const idx = $scope.selected.indexOf($scope.doc);


                    //const vid = Common.functiontofindIndexByKeyValue($scope.docs, '_id', $scope.doc._id);

                    $scope.selected = [];

                    for (let i in $scope.docs) {
                        $scope.docs[i].selected = false
                    }

                    // zárolási idő lejártakor ki kell venni a pipát a checkboxból
                    // $scope.selected.splice(idx, 1);
                    $scope.dispo.selectAll = false;
                    //this.$scope.socketService.remove(this.$scope.lockerVehicle);

                    //  $scope.doc.checkedTcn = false;
                    // $scope.docs[vid].checkedTcn = false;
                    $scope.dispo.vehiclebadgeCount = 0;
                }
                // };

                //start()

            }


            search(query) {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {
                    $or: [
                        {
                            'ticket': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'outTicket': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'inTicket': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'depotName': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'parentTicketName': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'plateNumber1': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'shipName': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'parentOrders': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                    ]
                };
                query.sort = {'createdAt': -1}
            }

            /**
             * Lock, unLock beállítása
             * @param options
             */
            // setLock(options) {
            //     let formId = options.order == null ? null : options.order._id;
            //     // let index = 0;
            //     // if (options.index) {
            //     //   index = options.index;
            //     // }
            //     if (options.tempId) {
            //         formId = options.tempId
            //     }
            //     if (options.contract && options.order.relatedContract[0]) {
            //         if (options.lock) {
            //             ngivrLockService.lock('contract:' + options.order.relatedContract[0]._id);
            //         } else {
            //             ngivrLockService.unlock('contract:' + options.order.relatedContract[0]._id);
            //
            //         }
            //     }
            //
            //     if (options.sellcontract && options.sellcontract._id) {
            //         if (options.lock) {
            //             ngivrLockService.lock('contract:' + options.sellcontract._id);
            //         } else {
            //             ngivrLockService.unlock('contract:' + options.sellcontract._id);
            //         }
            //     }
            //
            //     if (options.orders) {
            //         if (options.actual && options.order) { //csak a aktuális ordert lockoljuk
            //             if (options.lock) {
            //                 ngivrLockService.lock('order:' + options.order._id);
            //             } else {
            //                 ngivrLockService.unlock('order:' + options.order._id);
            //             }
            //         } else { //minden kapcsolódó ordert lockolunk
            //             let conditions = [];
            //             if (options.order.relatedContract === undefined) return;
            //             if (options.order.relatedContract[0] === undefined) return;
            //             if (options.order.relatedContract[0].reserved === undefined) return;
            //             if (options.order.relatedContract[0].reserved.orders === undefined) return;
            //             for (let i in options.order.relatedContract[0].reserved.orders) {
            //                 conditions.push({_id: options.order.relatedContract[0].reserved.orders[i].orderId})
            //             }
            //             let query = {
            //                 limit: 0,
            //                 search: {$or: conditions}
            //             };
            //
            //
            //             ngivrApi.query('order', query).then(function (response) {
            //                 let orders = response.data.docs;
            //                 for (let i in orders) {
            //                     this.$scope.lockerOrder = {
            //                         model: null,
            //                         schema: "Order",
            //                         formName: "",
            //                         event: "",
            //                         lockUser: Auth.getCurrentUser(),
            //                         locked: false
            //                     };
            //                     this.$scope.lockerOrder.model = orders[i];
            //                     this.$scope.lockerOrder.formName = "buyContractForm_" + formId;
            //                     if (options.lock) {
            //                         ngivrLockService.lock('order:' + orders[i]._id);
            //                     } else {
            //                         ngivrLockService.unlock('order:' + orders[i]._id);
            //                     }
            //                 }
            //             })
            //         }
            //
            //     }
            //
            //     if (options.vehicle) {
            //         for (let i in options.vehicles) {
            //             console.log(this.$scope.locklist);
            //             if (!options.vehicles[i].locked) {
            //                 if (options.lock) {
            //                     ngivrLockService.lock('vehicle:' + options.vehicles[i]._id);
            //                 } else {
            //                     ngivrLockService.unlock('vehicle:' + options.vehicles[i]._id);
            //                 }
            //             }
            //         }
            //     }
            //
            //     // this.$scope.socketService.get();
            // };

            startEkaer() {
                this.$scope.ekaer.request = true;
                // this.setLock({order: this.$scope.dispo, vehicle: true, lock: true, vehicles: docs});
                // for (let i in docs) {
                //   docs[i].notSelectable = false
                // }
            }

            cancelTcn() {
                // for (let i in this.$scope.selected) {
                //   this.$scope.lockerVehicle = {
                //     model: this.$scope.selected[i],
                //     schema: "Vehicle",
                //     formName: "dispoForm_" + this.$scope.selected[i]._id,
                //     event: "",
                //     lockUser: Auth.getCurrentUser(),
                //     locked: false
                //   };
                //   this.$scope.socketService.remove(this.$scope.lockerVehicle);
                // }

                //  this.setLock({order: this.$scope.dispo, vehicle: true, lock: false, vehicles: this.$scope.selected});
                this.$scope.selected = [];
                this.$scope.dispo.selectAll = false;
                this.$scope.ekaer.request = false;
                // this.$scope.socketService.get();
            }

            deleteTcn(vehicles) {
                if (vehicles.length === 0) return;
                let origVehicles = angular.copy(vehicles);
                const dispo = this.$scope.dispo;

                ngivrPrompt({
                    title: 'EKÁER törlése',
                    textContent: 'Kérem, adja meg a törlés okát!',
                    placeholder: 'Törlés oka',
                    ariaLabel: 'Törlés',
                    initialValue: 'Szállítás meghiúsult'
                }).then(function (statusChangeModReasonText) {
                    subDeleteTcn(statusChangeModReasonText);
                });

                function subDeleteTcn(statusText) {
                    const that = this;
                    try {
                        ngivrEkaer.deleteTcn(origVehicles, dispo, statusText, function (response) {
                            // if (response.vehicles) {
                            //   this.$scope.selected = response.vehicles
                            // }
                            if (response.vehicles && response.vehicles.length) {
                                for (let i in response.vehicles) {
                                    ngivrService.growl('EKÁER törlés sikertelen. Hiba: ' + response.vehicles[i].ekaerError);
                                }
                                that.cancelTcn();
                                return
                            }
                            if (response.globalError) {
                                ngivrService.growl('EKÁER törlés sikertelen. Hiba: ' + response.globalError)
                            }
                            that.cancelTcn()
                        })
                    }
                    catch (err) {
                        that.cancelTcn();
                        ngivrGrowl(err.message);
                    }
                }
            }

            createNewTcn() {
                const that = this;
                if (!that.$scope.dispo.loadLocation || that.$scope.dispo.loadLocation[0] === null || !that.$scope.dispo.unloadLocation || that.$scope.dispo.unloadLocation[0] === null) {
                    ngivrGrowl('Hiányzó fel- vagy/és lerakóhely!');
                    cancelTcn();
                    return
                }
                let origVehicles = angular.copy(that.$scope.selected);
                try {
                    ngivrEkaer.createTcn(origVehicles, that.$scope.dispo, function (response) {
                        // if (response.items) {
                        //   this.$scope.selected = response.items
                        // }
                        if (response.vehicles && response.vehicles.length) {
                            for (let i in response.vehicles) {
                                ngivrService.growl('EKÁER igénylés sikertelen. Hiba: ' + response.vehicles[i].ekaerError);
                            }
                            this.cancelTcn();
                            return
                        }

                        if (response.globalError) {
                            ngivrService.growl('EKÁER igénylés sikertelen. Hiba: ' + response.globalError)
                        }

                        that.cancelTcn()
                    })
                }
                catch (err) {
                    that.cancelTcn();
                    ngivrGrowl(err.message);
                }
            }

            finalizeTcn() {
                const that = this;
                let origVehicles = angular.copy(that.$scope.selected);
                try {
                    for (let i in origVehicles) {
                        ngivrApi.id('orderVehicle', origVehicles[i]._id).then(function (response) {
                            const vehicle = response.data.doc;
                            that.modifyTcn(vehicle, that.$scope.dispo, false, function () {
                                ngivrEkaer.finalizeTcn([vehicle], that.$scope.dispo, function (response) {
                                    // if (response.vehicles) {
                                    //   that.$scope.selected = response.vehicles
                                    // }
                                    if (response.vehicles && response.vehicles.length) {
                                        for (let i in response.vehicles) {
                                            ngivrService.growl('EKÁER véglegesítés sikertelen. Hiba: ' + response.vehicles[i].ekaerError);
                                        }
                                        that.cancelTcn();
                                        return
                                    }
                                    if (response.globalError) {
                                        ngivrService.growl('EKÁER törlés sikertelen. Hiba: ' + response.globalError)
                                    }

                                    that.cancelTcn()
                                })
                            });
                        })
                    }
                }
                catch (err) {
                    that.cancelTcn();
                    ngivrGrowl(err.message);
                }
            }

            modifyTcn(vehicle, dispo, showGrowl, cb) {
                const that = this;
                try {
                    that.$scope.getTCNData(vehicle);
                    ngivrEkaer.modifyTcn(vehicle, dispo, showGrowl, function (response) {
                        if (response.vehicles && response.vehicles.length) {
                            for (let i in response.vehicles) {
                                ngivrService.growl('EKÁER módosítás sikertelen. Hiba: ' + response.vehicles[i].ekaerError);
                            }
                            return
                        }
                        if (response.globalError) {
                            ngivrService.growl('EKÁER módosítás sikertelen. Hiba: ' + response.globalError);
                            return
                        }

                        if (cb) {
                            return cb();
                        }
                    });
                }
                catch (err) {
                    that.cancelTcn();
                    ngivrGrowl(err.message);
                }
            }

            isFinalizeForbidden(vehicles, dispo) {
                if (dispo.tradeType === 'E') return true;
                for (let i in vehicles) {
                    if (vehicles[i].plateNumber1 === null || vehicles[i].arrivalDate === null || vehicles[i].tradeType === 'I') {
                        return true
                    }
                }
                return false

            };

            /**
             * Jármű select checkbox
             * @param item a selectelt jármű dokumentum
             * @param list selectelt járművek listája
             * @param tcn ekaer szám
             * @param docs a jármű dokumetumok
             * @param more
             */
            toggle(item, list, tcn, docs, more) {
                const start = async () => {
                    this.$scope.doc = item;
                    this.$scope.vehicles = docs;
                    const idx = list.indexOf(item);

                    if (!this.$scope.dispo.hasOwnProperty('vehiclebadgeCount')) {
                        this.$scope.dispo.vehiclebadgeCount = 0;
                    }

                    const vid = Common.functiontofindIndexByKeyValue(docs, '_id', item._id);

                    // this.$scope.lockerVehicle = {
                    //   model: item,
                    //   schema: "Vehicle",
                    //   formName: "dispoForm_" + item._id,
                    //   event: "",
                    //   lockUser: Auth.getCurrentUser(),
                    //   locked: false
                    // };

                    if (idx > -1) { //ha szerepel a jármű a selecteltek között, akkor ez deselect, kivesszük a listából, és oldjuk a lockot
                        try {
                            if (!more) {
                                // await ngivrLockService.unlock('vehicle:' + item._id);
                                // this.$scope.lock = undefined;
                                // let idx = Common.functiontofindIndexByKeyValue(this.$scope.locks, 'resource', 'vehicle:' + item._id);
                                // if (idx !== null) {
                                //     this.$scope.locks.splice(idx, 1);
                                //     this.$scope.catchUnlockCallbackDestroyers.splice(idx, 1);
                                // }
                            }
                        } catch (err) {
                            console.log(err);
                        }
                        list.splice(idx, 1);
                        this.$scope.dispo.selectAll = false;
                        //this.$scope.socketService.remove(this.$scope.lockerVehicle);

                        item.checkedTcn = false;
                        docs[vid].checkedTcn = false;
                        this.$scope.dispo.vehiclebadgeCount -= 1;
                    } else { // betesszük a selectelt járművek listájába és lockoljuk
                        try {
                            if (!more) {
                                // let lock = await ngivrLockService.lock('vehicle:' + item._id, () => {
                                //     // zárolási idő lejártakor ki kell venni a pipát a checkboxból
                                //     list.splice(idx, 1);
                                //     this.$scope.dispo.selectAll = false;
                                //     //this.$scope.socketService.remove(this.$scope.lockerVehicle);
                                //
                                //     item.checkedTcn = false;
                                //     docs[vid].checkedTcn = false;
                                //     this.$scope.dispo.vehiclebadgeCount -= 1;
                                // });
                                // this.$scope.lock = lock;
                                // this.$scope.locks.push(lock);
                                // if (this.$scope.catchUnlockCallbackDestroyers[this.$scope.locks.length - 1] !== undefined) {
                                //     this.$scope.catchUnlockCallbackDestroyers[this.$scope.locks.length - 1]();
                                // }
                                //
                                // this.$scope.catchUnlockCallbackDestroyers.push(ngivrLockService.catchUnlockCallback(this.$scope, 'vehicle:' + item._id, this.$scope.unlockVehicle));
                            }


                        } catch (err) {
                            console.log(err);
                            return true;
                        }
                        list.push(item);
                        //this.$scope.socketService.add(this.$scope.lockerVehicle);

                        item.checkedTcn = true;
                        docs[vid].checkedTcn = true;
                        this.$scope.dispo.vehiclebadgeCount += 1;
                    }

                    // this.$scope.socketService.get();
                    this.setEkaerButtonsAndSelectableVehicles(list, item, docs);
                };

                start()
            };


            /**
             * Beáálítja, hogy melyik EKÁER művelet aktív, és melyik jármű selectelhető
             * @param list
             * @param item
             * @param docs
             */
            setEkaerButtonsAndSelectableVehicles(list, item, docs) {
                if (list.length) { //ha van kiválasztott jármű
                    if (item.tcn) { //ha van ekaer szám, nem igényelhető
                        this.$scope.isDisabled.createTcn = true;
                        this.$scope.isDisabled.finalizeTcn = this.isFinalizeForbidden(list, this.$scope.dispo);

                        this.$scope.isDisabled.deleteTcn = false;

                        for (let i in docs) {
                            if (docs[i].tcn) {
                                if (docs[i].plateNumber1 !== null && docs[i].arrivalDate !== null) {
                                    docs[i].notFinalizable = false
                                }
                                docs[i].notSelectable = false
                            } else {
                                docs[i].notSelectable = true
                            }
                        }
                    } else { //ha nincs ekaer-szám, csak igényelni lehet, és az selectelhető, ahol nincs ekáer-szám
                        this.$scope.isDisabled.createTcn = false;
                        this.$scope.isDisabled.finalizeTcn = true;
                        this.$scope.isDisabled.deleteTcn = true;
                        for (let i in docs) {
                            if (docs[i].tcn !== undefined) {
                                docs[i].notSelectable = true
                            } else {
                                docs[i].notSelectable = false
                            }
                        }
                    }
                } else {
                    this.$scope.isDisabled.createTcn = true;
                    this.$scope.isDisabled.finalizeTcn = true;
                    this.$scope.isDisabled.deleteTcn = true;
                    for (let i in docs) {
                        docs[i].notSelectable = false;
                        docs[i].notFinalizable = false
                    }
                }
            };

            exists(item, list) {
                return list.indexOf(item) > -1;
            };

            isVehicleLocked(vehicle) {

                try {
                    let lock = this.$scope.redisLockList.filter((o) => {
                        return o.doc === 'vehicle:' + vehicle._id
                    });

                    if (!lock.length) return false;

                    if (lock[0].user !== Auth.getCurrentUser()._id) return true;

                    // for (let i in this.$scope.redisLockList) {
                    //   if ((vehicle._id === this.$scope.locklist[i].data.model._id
                    //       && this.$scope.locklist[i].data.user._id !== Auth.getCurrentUserId())) {
                    //     return true
                    //   }
                    // }

                    // for (let i in this.$scope.locklist) {
                    //   if ((vehicle._id === this.$scope.locklist[i].data.model._id
                    //       && this.$scope.locklist[i].data.user._id !== Auth.getCurrentUserId())) {
                    //     return true
                    //   }
                    // }
                }
                catch (err) {
                    return false
                }
                return false
            };

            async selectAllVehicles(docs) {
                if (this.$scope.dispo.ekaer) { // ha van ekaer
                    if (this.$scope.selected.length === 0) { //nincs kiválasztott jármű
                        let isTcn = false;
                        let isTcn2;
                        let status = undefined;
                        for (let i in docs) {
                            if (i == 0) {
                                isTcn = docs[i].tcn ? true : false;
                                status = docs[i].tcnStatus
                            } else {
                                isTcn2 = docs[i].tcn ? true : false;
                                if (docs[i].tcnStatus !== 'F' && (docs[i].tcnStatus !== status || isTcn !== isTcn2)) {
                                    ngivrGrowl('Kérem jelöljön ki legalább egy járművet!');
                                    this.$scope.dispo.selectAll = false;
                                    return
                                }
                            }
                        }
                    }
                    if (!this.$scope.dispo.selectAll) { //ha deselectelni akarunk
                        //this.$scope.selected = [];
                        let docsToUnlock = docs.filter((o) => {
                            return o.checkedTcn
                        });
                        let resources = [];
                        for (let doc of docsToUnlock) {
                            resources.push('vehicle:' + doc._id)
                        }
                        // await ngivrLockService.unlockMore(resources);
                        for (let doc of docsToUnlock) {
                            this.toggle(doc, this.$scope.selected, doc.tcn, docs, false);
                        }

                        // for (let doc of docs) {
                        //   if (doc.checkedTcn) {
                        //     this.toggle(doc, this.$scope.selected, doc.tcn, docs);
                        //   }
                        // }
                        return
                    } else {  //ha selectelni akarunk
                        // if (!this.$scope.selected[0].tcn) { //ha még nincs tcn, akkor csak a tcn nélkülieket pipáljuk
                        //   for (let doc of docs) {
                        //     if (!doc.tcn && !doc.checkedTcn) {
                        //       this.toggle(doc, this.$scope.selected, doc.tcn, docs);
                        //     }
                        //   }
                        //   return
                        // } else {
                        let toLock = [];
                        let resurceList = [];

                        let docsToLock = docs.filter((o) => {
                            return !o.notSelectable && !o.checkedTcn && o.tcnStatus !== 'F'
                        });
                        for (let doc of docsToLock) {


                            toLock.push({resource: 'vehicle:' + doc._id})
                        }
                        //await ngivrLockService.lockMore(toLock);
                        for (let doc of docsToLock) {
                            if (!doc.notSelectable && !doc.checkedTcn && doc.tcnStatus !== 'F') {
                                this.toggle(doc, this.$scope.selected, doc.tcn, docs, false);
                            }
                        }


                        // for (let doc of docs) {
                        //   if (!doc.notSelectable && !doc.checkedTcn && doc.tcnStatus !== 'F') {
                        //     this.toggle(doc, this.$scope.selected, doc.tcn, docs);
                        //   }
                        // }
                        return

                        //}
                    }
                }

                if (this.$scope.dispo.selectAll) { //minden select
                    let toLock = [];
                    let docsToLock = docs.filter((o) => {
                        return !this.isVehicleLocked(o) && !this.$scope.isDisabled.ekaerCheckbox(o) && !o.checkedTcn
                    });
                    //
                    // for (let doc of docsToLock) {
                    //
                    //
                    //     toLock.push({resource: 'vehicle:' + doc._id})
                    // }
                    //  await ngivrLockService.lockMore(toLock);
                    for (let doc of docsToLock) {
                        if (!doc.notSelectable && !doc.checkedTcn && doc.tcnStatus !== 'F') {
                            this.toggle(doc, this.$scope.selected, doc.tcn, docs, true);
                        }
                    }


                } else { // minden deselect
                    let docsToUnlock = docs.filter((o) => {
                        return o.checkedTcn
                    });
                    // let resources = [];
                    // for (let doc of docsToUnlock) {
                    //     resources.push('vehicle:' + doc._id)
                    // }
                    // await ngivrLockService.unlockMore(resources);
                    for (let doc of docsToUnlock) {
                        this.toggle(doc, this.$scope.selected, doc.tcn, docs, true);
                    }
                }

                // if (this.$scope.dispo.selectAll) {
                //   this.$scope.selected = [];
                // }


                // for (let i in docs) {
                //   if (!this.isVehicleLocked(docs[i]) && !this.$scope.isDisabled.ekaerCheckbox(docs[i]) ) {
                //     this.toggle(docs[i], this.$scope.selected, docs[i].tcn, docs);
                //   }
                // }

                if (this.$scope.selected.length === 0) this.$scope.dispo.selectAll = false;
            }

            calculateDiscrepanciesDelivery(doc) {
                let display = (doc.unloadedWeight - doc.loadedWeight) > 0 ? '+' : '';
                display += $filter('number')(doc.unloadedWeight - doc.loadedWeight, 3);
                display += ' mt';
                return display;
            };

            /**
             * Dispo teljesítettségét és a szállítási eltéréseket számolja
             * @param dispo
             */
            // getPerformedAndTransportDiff(dcos) {
            //   //this.$scope.dispo.performed = 0; //szállításból teljesített mennyiség
            //   this.$scope.dispo.transportDiff = 0; //szálítási eltérés
            //   for (let i in dcos) {
            //     if ((dcos[i].ticketName !== null || dcos[i].ticketNames.length > 0) && !dcos[i].ticketDeleted) { //a vehicle tömb azon elemeit vesszük figyelembe, ahol a ticket már be lett küldve
            //       // if (this.$scope.dispo.relatedContract[0].buy) {
            //       //   if (this.$scope.dispo.relatedContract[0].parity[0].transCostBuy) {
            //       //     this.$scope.dispo.performed += dcos[i].loadedWeight
            //       //   } else {
            //       //     this.$scope.dispo.performed += dcos[i].unloadedWeight
            //       //   }
            //       // } else {
            //       //   if (this.$scope.dispo.relatedContract[0].parity[0].transCostSell) {
            //       //     this.$scope.dispo.performed += dcos[i].unloadedWeight
            //       //   } else {
            //       //     this.$scope.dispo.performed += dcos[i].loadedWeight
            //       //   }
            //       // }
            //       this.$scope.dispo.transportDiff += dcos[i].unloadedWeight - dcos[i].loadedWeight
            //     }
            //   }
            // };

            /**
             * Jármű sor törlése
             * @param docs
             * @param oneVehicle
             */
            async deleteAllVehicle(docs, oneVehicle) {  //TODO a törlés logikája rossz! Előbb törli az ekaer-t, majd csak utána ellenőrzi a jármű törölhetőségét!!!!!
                let that = this;

                try {

                    await ngivrConfirm(docs.length === 1 ? 'Biztosan törölhetem a járművet?' : 'Biztosan törölhetem az összes kijelölt járművet?');

                    let hasVehicleTcn = await ngivrTicketValidation.checkVehiclesHasTCN(docs);
                    let statusChangeModReasonText = undefined;

                    if (hasVehicleTcn) {
                        statusChangeModReasonText = await ngivrPrompt({
                            title: 'EKÁER törlése',
                            textContent: 'Kérem, adja meg a törlés okát!',
                            placeholder: 'Törlés oka',
                            ariaLabel: 'Törlés',
                            initialValue: 'Szállítás meghiúsult'
                        })
                    }

                    await doIT(docs, statusChangeModReasonText, oneVehicle)


                } catch (e) {
                    console.error(e)
                }


                async function doIT(docs, reasonText, oneVehicle) {
                    let originalVehicle = {};
                    let vehicle = {};
                    let checked = docs;
                    if (!oneVehicle) {
                        checked = docs.filter((o) => {
                            return o.checkedTcn
                        });
                    }

                    try {
                        for (let i in checked) {
                            vehicle = checked[i];
                            originalVehicle = angular.copy(vehicle);
                            if ((checked[i].checkedTcn || checked.length === 1) && !that.isVehicleLocked(checked[i])) {

                                if (reasonText !== undefined) {
                                    ngivrTicketValidation.checkVehicleHasDeletableTCN(checked[i], that.$scope.dispo.shipOnType, function (response) {
                                        if (response) {
                                            ngivrEkaer.deleteTcn([checked[i]], that.$scope.dispo, reasonText, function (response) {
                                                if (response.vehicles) {
                                                    that.$scope.selected = response.vehicles
                                                }
                                                if (response.vehicles && response.vehicles.length) {
                                                    for (let i in response.vehicles) {
                                                        ngivrService.growl('EKÁER törlés sikertelen. Hiba: ' + response.vehicles[i].ekaerError);
                                                    }
                                                    // that.$scope.setLock({
                                                    //     order: that.$scope.dispo,
                                                    //     vehicle: true,
                                                    //     lock: false
                                                    // });
                                                    return
                                                }
                                                if (response.globalError) {
                                                    ngivrService.growl('EKÁER törlés sikertelen. Hiba: ' + response.globalError)
                                                }
                                                ngivrTicketValidation.checkVehicleHasDeletableTicket(checked[i], that.$scope.dispo.shipOnType, function (response) {
                                                    if (response) {
                                                        ngivrTicketValidation.checkVehicleHasTicket(checked[i], function (response) {
                                                            if (response) {
                                                                ngivrTicketValidation.setTicketToDeleted(checked[i], function () {
                                                                    that.updateVehicleTicketDeleted(checked[i]);
                                                                })
                                                            }
                                                            else {
                                                                that.deleteVehicle(checked[i]);
                                                            }
                                                        })
                                                    }
                                                })
                                            })
                                        }
                                    })
                                }
                                else {
                                    ngivrTicketValidation.checkVehicleHasDeletableTicket(checked[i], that.$scope.dispo.shipOnType, function (response) {
                                        if (response) {
                                            ngivrTicketValidation.checkVehicleHasTicket(checked[i], function (response) {
                                                if (response) {
                                                    ngivrTicketValidation.setTicketToDeleted(checked[i], function () {
                                                        that.updateVehicleTicketDeleted(checked[i]);
                                                    })
                                                }
                                                else {
                                                    that.deleteVehicle(checked[i]);
                                                }
                                            })
                                        }
                                    })
                                }
                            }
                            else {
                                ngivrGrowl('Jármű törlés nem lehetséges Lock miatt: ' + (checked[i].tcn === undefined ? checked[i]._id : checked[i].tcn));
                            }
                        }
                    }
                    catch (err) {
                        vehicle = angular.copy(originalVehicle);
                        //  await ngivrLockService.unlock('vehicle:' + vehicle._id);
                        //that.$scope.lockerVehicle.model = vehicle;
                        // that.$scope.socketService.remove(that.$scope.lockerVehicle);
                        // that.$scope.socketService.get();
                    }
                }
            }

            /**
             * Egy jármű törlése (logikai törlés
             * @param vehicle
             * @param cb
             */
            deleteVehicle(vehicle, cb) {
                const start = async () => {
                    try {
                        //    await ngivrLockService.unlock('vehicle:' + vehicle._id);
                        //this.$scope.lockerVehicle.model = vehicle;
                        // this.$scope.socketService.remove(this.$scope.lockerVehicle);
                        vehicle.deleted = true;
                        await ngivrApi.save('orderVehicle', vehicle);
                        ngivrGrowl('Töröltem a járművet');
                        if (cb) {
                            return cb()
                        }
                        // ngivrApi.save('orderVehicle', vehicle, function () {
                        //     ngivrGrowl('Töröltem a járművet');
                        //     if (cb) {
                        //         return cb()
                        //     }
                        // });
                    } catch (err) {
                        ngivrService.exception.handler(err)
                    }

                };

                start()
            };

            updateVehicleTicketDeleted(vehicle, cb) {
                const start = async () => {
                    try {
                        //    await ngivrLockService.unlock('vehicle:' + vehicle._id);
                        // this.$scope.lockerVehicle.model = vehicle;
                        // this.$scope.socketService.remove(this.$scope.lockerVehicle);
                        vehicle.ticketDeleted = true;
                        await ngivrApi.save('orderVehicle', vehicle);
                        ngivrGrowl('Töröltem a járművet');
                        if (cb) {
                            return cb()
                        }
                        // ngivrApi.save('orderVehicle', vehicle, function (response) {
                        //     ngivrGrowl('Töröltem a járművet');
                        //     if (cb) {
                        //         return cb()
                        //     }
                        // });
                    } catch (err) {
                        ngivrService.exception.handler(err)
                    }

                };
                start()
            }

            ticketBackground(doc) {
                return (doc.inTicket || doc.outTicket) ? (doc.unloadedWeight ? 'green-plane' : 'yellow-plane') : 'grey-plane';
            }

            rualTourTicketBackground(doc, mode) {

                let className = 'grey-plane';

                switch (mode) {

                    case 'in':

                        if (!doc.inTicket) { // ha nincs inTicket, akkor szürke
                            className = 'grey-plane';
                        }
                        else {                          // van inTicket
                            if (!doc.unloadedWeight) {   // nincs lerakott súly, akkor sárga
                                className = 'yellow-plane';
                            } else {                      // van lerakott súly is, akkor zöld
                                className = 'green-plane';
                            }
                        }
                        break;

                    case 'out':

                        if (!doc.outTicket) {
                            className = 'grey-plane';
                        }
                        else {
                            className = 'green-plane';
                        }
                        break;

                }
                return className;
            }

        }
    }
});
