'use strict';
ngivr.angular.directive('ngivrListTrackingVehicles', ($http, $filter, socket, $mdMedia, ngivrService, $timeout, ngivrEkaer, Auth, ngivrGrowl, Common, ngivrPrompt, ngivrConfirm, ngivrApi, ngivrTicketValidation, $window, ngivrLockList, ngivrDebounce) => {
    // let vehicleIndex = 0;
    return {
        restrict: 'E',
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-tracking-vehicles.html',
        scope: {
            ngivrQuery: '=',
            dispo: '=',
            dispos: '=',
            wrongEkaer: '<',
            sellContracts: '<?'
        },
        transclude: true,
        controller: function ($scope) {
            const self = this;


            if (!$scope.dispo._id) {
                /**
                 * Új order esetén kell egy watch, ami módosítja a query-t, ha megkapja az order az _id-t
                 */
                $scope.$watch('dispo._id', (newVal, oldVal) => {
                    if (newVal && newVal !== oldVal) {
                        $scope.ngivrQuery = {
                            'sort': {'createdAt': -1},
                            'search': {
                                deleted: false,
                                orderId: newVal,
                                tcnStatus: {$ne: 'I'}
                            }
                        };
                        ngivr.list.requery($scope);
                    }
                })
            }

            this.ngivrLockListInstance = ngivrLockList({
                scope: $scope,
                schema: 'orderVehicle',
                watch: 'docs',
                list: true,
                onUnlock: (options) => {
                    // console.log(options)
                    $scope.selected = $scope.selected.filter(doc => {
                        return options.doc._id !== doc._id;
                    });
                    self.$scope.dispo.selectAll = false
                },
                onAutoUnlockOrError: (options) => {
                    //console.log(options);
                    self.$scope.dispo.selectAll = false;
                    $scope.selected = [];
                    $scope.publish('closePopup')
                }
            });


            //const start = async () => {

            // vehicleIndex++;
            // const thisVehicleIndex = vehicleIndex;

            this.$scope = $scope;
            $scope.$mdMedia = $mdMedia;
            $scope.cssPrefix = $scope.dispo ? $scope.dispo.bfkd ? 'vslBfkd' : 'vsl' : 'vslBfkd';
            this.$scope.selected = [];

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
                //$scope.selected = [];

                //  $scope.setSubscribers();
                for (let doc of data.targetScope.query.docs) {
                    if ($scope.dispo.bfkd) { //bfk order járműjéről van szó
                        let resp = await ngivrApi.query('ticket', {search: {ledger: {$elemMatch: {subTicketName: doc.outTicket}}}});
                        doc.shipName = resp.data.docs[0].ship.name;
                        resp = await ngivrApi.id('ticket', resp.data.docs[0].parentTicketId);
                        doc.inTicketNumber = resp.data.doc.ticketName;
                        doc.relatedOrderNumber = resp.data.doc.ledger[0].orderNumber
                    }
                    //doc.loadDate = $filter('date')(doc.loadDate, 'yyyy.MM.dd');
                    doc.loadedWeightFormatted = $filter('number')(doc.loadedWeight, 3);
                    doc.unloadedWeightFormatted = $filter('number')(doc.unloadedWeight, 3);
                    if (doc.loadedWeight) {
                        doc.loadedWeight = Number(doc.loadedWeight.toFixed(3));
                    }
                    if (doc.unloadedWeight) {
                        doc.unloadedWeight = Number(doc.unloadedWeight.toFixed(3));
                    }
                    //doc.deletable = await $scope.isTicketDeletable(doc)
                    console.log(doc.deletable)

                }
                this.cancelTcn();
            });

            $scope.isTicketDeletable = async (ticket) => {
                console.log($scope.dispo)
                let hasDeletable = await ngivrTicketValidation.checkVehicleHasDeletableTCN(ticket, $scope.dispo.shipOnType)
                return hasDeletable
            }


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
                        || vehicle.notSelectable || vehicle.notFinalizable || vehicle.ticketDeleted || ((vehicle.inTicket || vehicle.outTicket) && !vehicle.tcn)
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

            $scope.subscribe('vehiclelistupdated', () => {
                this.cancelTcn();
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

            this.search = (query) => {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {
                    $and: [
                        {deleted: false},
                        {orderId: $scope.dispo._id},
                        {tcnStatus: {$ne: 'I'}},
                        {
                            $or: [
                                {'tcn': {$regex: search, $options: 'i'}},
                                {'depot.depotName': {$regex: search, $options: 'i'}},
                                {'carrier.name': {$regex: search, $options: 'i'}},
                                {'plateNumber1': {$regex: search, $options: 'i'}},
                            ]
                        }
                    ]

                };
                query.sort = {'createdAt': -1}
            };


            this.startEkaer = () => {
                this.$scope.ekaer.request = true;
                // this.setLock({order: this.$scope.dispo, vehicle: true, lock: true, vehicles: docs});
                // for (let i in docs) {
                //   docs[i].notSelectable = false
                // }
            };

            this.cancelTcn = async () => {
//                this.$scope.dispo.selectAll = false;
                this.$scope.ekaer.request = false;
                await this.selectAllVehicles(this.$scope.selected, null, true)
            };

            this.deleteTcn = (vehicles) => {
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
            };

            this.createNewTcn = () => {
                const that = this;
                try {

                    if (!that.$scope.dispo.loadLocation || that.$scope.dispo.loadLocation[0] === null || !that.$scope.dispo.unloadLocation || that.$scope.dispo.unloadLocation[0] === null) {
                        ngivrGrowl('Hiányzó fel- vagy/és lerakóhely!');
                        cancelTcn();
                        return
                    }
                    let origVehicles = angular.copy(that.$scope.selected);

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
            };

            this.finalizeTcn = () => {
                const that = this;
                let origVehicles = angular.copy(that.$scope.selected);
                try {
                    let success = true;
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
                                        ngivrService.growl('EKÁER véglegesítés sikertelen. Hiba: ' + response.globalError)
                                        success = false
                                    }

                                    that.cancelTcn()
                                })
                            });
                        })
                    }
                    if (success) {
                        ngivrService.growl('EKAER lezárás sikeres!', 'info')
                    }
                }
                catch (err) {
                    that.cancelTcn();
                    ngivrGrowl(err.message);
                }
            };

            this.modifyTcn = (vehicle, dispo, showGrowl, cb) => {
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
            };

            this.isFinalizeForbidden = (vehicles, dispo) => {
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
            this.toggle = async (item, list, tcn, docs, options = {}) => {

                const {autoUnlock} = options;

                this.$scope.doc = item;
                this.$scope.vehicles = docs;
                let idx = Common.functiontofindIndexByKeyValue(list, '_id', item._id);


                if (!this.$scope.dispo.hasOwnProperty('vehiclebadgeCount')) {
                    this.$scope.dispo.vehiclebadgeCount = 0;
                }

                const vid = Common.functiontofindIndexByKeyValue(docs, '_id', item._id);

                let type;
                try {
                    if (idx !== null) { //ha szerepel a jármű a selecteltek között, akkor ez deselect, kivesszük a listából, és oldjuk a lockot
//                        if (autoUnlock) {
//                            ngivr.growl(`found unlock! ${item._id}`)
//                        }
                        if (autoUnlock !== true) {
                            type = 'unlock';
                            await this.ngivrLockListInstance.unlockDocument({
                                doc: item
                            })
                        }


                        if (docs[vid] !== undefined) {
                            docs[vid].checkedTcn = false;
                        }
                        // it lehet keveres meg, akkor ugy kell
                        // hogy a tomb maradjon, de empty kell
                        // de ugy tunik mukodik
                        list.splice(idx, 1);

                        this.$scope.dispo.selectAll = false;
                        //this.$scope.socketService.remove(this.$scope.lockerVehicle);

                        item.checkedTcn = false;
                        //docs[vid].checkedTcn = false;
                        this.$scope.dispo.vehiclebadgeCount -= 1;


                    } else { // betesszük a selectelt járművek listájába és lockoljuk

                        if (autoUnlock !== true) {
                            type = 'lock';
                            await this.ngivrLockListInstance.lockDocument({
                                doc: item
                            })
                        }


                        list.push(item);
                        //this.$scope.socketService.add(this.$scope.lockerVehicle);
                        let selectableVehicles = docs.filter((o) => {
                            return o.notSelectable === false
                        });

                        if (list.length === selectableVehicles.length && this.$scope.dispo.selectAll === false) {
                            this.$scope.dispo.selectAll = true
                        }

                        item.checkedTcn = true;
                        docs[vid].checkedTcn = true;
                        this.$scope.dispo.vehiclebadgeCount += 1;
                    }

                    this.setEkaerButtonsAndSelectableVehicles(list, item, docs);
                } catch (e) {
                    if (type === 'lock') {
                        ngivr.growl(ngivr.strings.lockStatus.alreadyLocked)
                    } else if (type !== undefined) {
                        ngivr.growl(ngivr.strings.lockStatus.couldNotUnlock)
                    }
                    ngivrService.exception.handler(e);
                }

            };


            /**
             * Beáálítja, hogy melyik EKÁER művelet aktív, és melyik jármű selectelhető
             * @param list
             * @param item
             * @param docs
             */
            this.setEkaerButtonsAndSelectableVehicles = (list, item, docs) => {
                if (list.length) { //ha van kiválasztott jármű
                    if (item.tcn || (!item.tcn && (item.inTicket || item.outTicket))) { //ha van ekaer szám, vagy nincs ekaer-szám, de van ticket, akkor nem igényelhető
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

            this.exists = (item, list) => {
                let idx = Common.functiontofindIndexByKeyValue(list, '_id', item._id);
                return idx !== null;
            };

            this.isVehicleLocked = (vehicle) => {
                return this.ngivrLockListInstance.isDocumentLocked({
                    doc: vehicle
                })
            };

            this.selectAllVehicles = async (docs, fromSwitch, cancel) => {
                async function deselect(toggle, selected) {
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
                        await toggle(doc, selected, doc.tcn, docs, false);
                    }

                    // for (let doc of docs) {
                    //   if (doc.checkedTcn) {
                    //     this.toggle(doc, this.$scope.selected, doc.tcn, docs);
                    //   }
                    // }
                }

                async function select(toggle, selected) {
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
                        return !o.notSelectable && !o.checkedTcn && o.tcnStatus !== 'F' && !(!o.tcn && (o.inTicket || o.outTicket))
                    });
                    for (let doc of docsToLock) {


                        toLock.push({resource: 'vehicle:' + doc._id})
                    }
                    //await ngivrLockService.lockMore(toLock);
                    for (let doc of docsToLock) {
                        if (!doc.notSelectable && !doc.checkedTcn && doc.tcnStatus !== 'F') {
                            await toggle(doc, selected, doc.tcn, docs, false);
                        }
                    }


                    // for (let doc of docs) {
                    //   if (!doc.notSelectable && !doc.checkedTcn && doc.tcnStatus !== 'F') {
                    //     this.toggle(doc, this.$scope.selected, doc.tcn, docs);
                    //   }
                    // }
                }

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
                    if (fromSwitch) {
                        if (!this.$scope.dispo.selectAll) {
                            await deselect(this.toggle, this.$scope.selected);
                            return
                        } else {
                            await select(this.toggle, this.$scope.selected);
                            return
                        }

                    } else {
                        if (this.$scope.dispo.selectAll || cancel) {
                            await deselect(this.toggle, this.$scope.selected);
                            return
                        } else {
                            await select(this.toggle, this.$scope.selected);
                            return
                        }
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

                //if (this.$scope.selected.length === 0) this.$scope.dispo.selectAll = false;
            };

            this.calculateDiscrepanciesDelivery = (doc) => {
                let display = '---';
                if (doc.unloadedWeight) {
                    display = (doc.unloadedWeight - doc.loadedWeight) > 0 ? '+' : '';
                    display += $filter('number')(doc.unloadedWeight - doc.loadedWeight, 3);
                    display += ' mt';
                }

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
            this.deleteAllVehicle = async (docs, oneVehicle) => {  //TODO a törlés logikája rossz! Előbb törli az ekaer-t, majd csak utána ellenőrzi a jármű törölhetőségét!!!!!
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
            };

            /**
             * Egy jármű törlése (logikai törlés
             * @param vehicle
             * @param cb
             */
            this.deleteVehicle = (vehicle, cb) => {
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

            this.updateVehicleTicketDeleted = (vehicle, cb) => {
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
            };

            this.ticketBackground = (doc) => {
                let color;
                if (doc.inTicket || doc.outTicket) {
                    if (doc.loadedWeight && (!doc.unloadedWeight || ($scope.dispo.direction === 'internal' && !doc.inTicket))) {

                        color = 'yellow-plane'
                    } else if (doc.loadedWeight && doc.unloadedWeight) {
                        if (!doc.inTicketDeleted && !doc.outTicketDeleted) {
                            color = 'green-plane'
                        } else {
                            color = 'grey-plane'
                        }
                    }
                } else {
                    color = 'grey-plane'
                }
                return color
                //return (doc.inTicket || doc.outTicket) ? (doc.unloadedWeight && !doc.inTicketDeleted ? 'green-plane' : 'yellow-plane') : 'grey-plane';
            };

            this.rualTourTicketBackground = (doc, mode) => {

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
