ngivr.angular.directive('ngivrPopupChangeOrderInTicket', (ngivrService) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        // require: 'ngModel',
        transclude: true,
        scope: {
            ngDisabled: '=?',
            ngModel: '='
        },
        link: (scope, elm, attrs, ctrl) => {
            if (attrs.type === undefined) {
                attrs.type = 'popup';
            }
            if (attrs.style === undefined) {
                attrs.style = '';
            }
            if (attrs.class === undefined) {
                attrs.class = '';
            }
            if (attrs.ekaer === undefined) {
                attrs.ekaer = false;
            }
        },

        template: `<div> 
                  <ngivr-icon-fa 
                  ngivr-tooltip="Átmozgatás másik diszpozícióra"
                  ngivr-tooltip-direction="left"
                  ng-click=" showAdvanced($event)" ngivr-fa-margin="margin-top: 0px;"
                  ngivr-icon-fa="fa fa-repeat"/>
                        
                 </div>

      `,
        controller: function ($scope, $mdDialog, socket, ngivrSocketLock, ngivrGrowl, Auth, $http, ngivrApi, ngivrException, $rootScope) {
            $scope.ngivr = service;
            $scope.socketService = ngivrSocketLock;
            $scope.showAdvanced = function (ev) {
                if (ev !== undefined) {
                    ev.stopImmediatePropagation();
                }
                $mdDialog.show({

                    controller: PopupController,
                    templateUrl: 'components/ui/popup/changeOrderInTicket/ngivr-popup-change-order-in-ticket.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: false, // Only for -xs, -sm breakpoints.

                    locals: {
                        doc: $scope.ngModel
                    },
                    multiple: true
                })
                    .then(function (answer) {
                        $scope.status = 'You said the information was "' + answer + '".';
                    }, function () {
                        $scope.status = 'You cancelled the dialog.';
                    });
            };

            function PopupController($scope, $mdDialog, ngivrService, doc, ngivrHttp) {

                const start = async () => {
                    $scope.ngivr = ngivrService;

                    if (doc.ledgerLength !== undefined) {
                        let resp = await ngivrApi.id('ticket', doc._id);
                        $scope.ticket = resp.data.doc
                    } else {
                        $scope.ticket = doc;
                    }


                    $scope.orderError = {};

                    $scope.model = {
                        dstOrder: undefined,
                        origOrder: undefined,
                        ship: undefined,
                        reason: undefined,
                        keepVehicle: undefined
                    };

                    let resp = await ngivrApi.id('order', $scope.ticket.ledger[0].orderId);
                    $scope.model.origOrder = resp.data.doc;


                    $scope.hide = function () {
                        $mdDialog.hide();
                        if ($scope.cb) {
                            return $scope.cb();
                        }
                    };

                    $scope.cancel = function () {
                        $mdDialog.hide();
                        if ($scope.cb) {
                            return $scope.cb();
                        }
                    };

                    $scope.changeReason = undefined;

                    /**
                     * A célorder-t figyeli
                     */
                    $scope.$watch('model.dstOrder', async (newVal, oldVal) => {
                        if (newVal) {
                            if (newVal.cargoPlanId) {
                                let resp = await ngivrApi.id('cargoPlan', newVal.cargoPlanId);
                                $scope.model.cargoPlan = resp.data.doc
                            }
                        }


                    }, true);

                    /**
                     * A forrás order-t figyeli
                     */
                    $scope.$watch('model.origOrder', async (newVal, oldVal) => {
                        if (newVal) {
                            if (newVal.ekaer) {
                                $scope.model.keepVehicle = true
                            } else {
                                $scope.model.keepVehicle = false
                            }
                        } else {
                            $scope.model.keepVehicle = undefined
                        }

                    }, true);

                    /**
                     * Megosztás gomb
                     */
                    $scope.answer = async () => {
                        try {
                            if (!$scope.ngivr.form.validate($scope.changeOrderForm)) {
                                //$scope.buttonsDisabled = false;
                                throw new Error("Sikertelen form validáció");
                            } else {

                                ngivr.overlay.show();
                                if ($scope.model.origOrder._id === $scope.model.dstOrder._id) {
                                    $scope.model.keepVehicle = false
                                }
                                let currentUser = Auth.getCurrentUser();
                                let shipTicket; //out ticket, ami  hajóba teljesít
                                // megkeressük a betöltött ticket járművét
                                let subTicketName = $scope.ticket.ledger[0].subTicketName;
                                let resp = await ngivrApi.query('orderVehicle', {search: {$or: [{inTicket: subTicketName}, {outTicket: subTicketName}]}});
                                let vehicle = resp.data.docs[0];
                                // ha hajós ticket és már hajóban az áru, akkor törölni kell a hajóba teljesítő ticketet
                                if ($scope.model.origOrder.intShip && $scope.model.origOrder.parentOrderId
                                    || $scope.model.origOrder.shipOnType && $scope.model.origOrder.shipOnType === 'bvsz') {
                                    shipTicket = await $scope.takeProductFromShip(currentUser, $scope.ticket._id);
                                    if (shipTicket.message) {
                                        ngivrException.handler(shipTicket);
                                        ngivr.overlay.hide();
                                        return
                                    }// throw new Error(shipTicket.message)
                                }

                                //ticket beállítása
                                await $scope.setTicket();
                                await $scope.fillLedgerFromDispo($scope.ticket.ledger[0], $scope.model.dstOrder);

                                $scope.ticket.change = {
                                    reason: $scope.changeReason,
                                    date: new Date(),
                                    userId: currentUser._id,
                                    userName: currentUser.fullName
                                };
                                $scope.ticket.changed = true;
                                if ($scope.ticket.direction === 'internal_in' && $scope.model.origOrder._id !== $scope.model.dstOrder._id) { // internal in módosítása esetén az internal_out is módosul, de csak akkor, ha a két order különbözik
                                    let result = await $scope.modifyInternalOutTicket(currentUser);
                                    if (result !== true) {
                                        ngivrException.handler(result);
                                        ngivr.overlay.hide();
                                        return
                                    }
                                }
                                await ngivrHttp.put('api/tickets/' + $scope.ticket._id, $scope.ticket);

                                //  járművet is módosítani kell
                                await $scope.modifyVehicle(vehicle, undefined, $scope.model.dstOrder.ekaer);
                                if ($scope.model.dstOrder.intShip && $scope.model.dstOrder.parentOrderId
                                    || $scope.model.dstOrder.shipOnType && $scope.model.dstOrder.shipOnType === 'bvsz') { // kell egy ouTicket, ami az AFK-ra teljesít és hajóba pakol, de csak akkor, ha nem raktárba pakolunk
                                    let result = await $scope.takeProductToShip(shipTicket);
                                    if (result !== true) {
                                        if (result !== true) {
                                            ngivrException.handler(result);
                                            ngivr.overlay.hide();
                                            return
                                        }
                                    }
                                }
                                ngivr.growl('A módosítás sikeres!');
                                $mdDialog.hide();
                                ngivr.overlay.hide()
                            }
                        } catch (e) {
                            ngivrException.handler(e);
                            ngivr.overlay.hide()
                        }
                    };

                    /**
                     * Kiveszi a terméket a hajóból
                     * @param currentUser
                     * @returns {Promise<*>}
                     */
                    $scope.takeProductFromShip = async (currentUser, parentTicketId) => {
                        try {
                            let shipTicket;
                            let resp = await ngivrApi.query('ticket', {
                                ignoreOverride: true,
                                search: {
                                    'ledger.orderId': $scope.model.origOrder.parentOrderId,
                                    deleted: false,
                                    parentTicketId: parentTicketId
                                }
                            });
                            if (resp.data.docs.length) {
                                shipTicket = resp.data.docs[0];

                                shipTicket.delete = {
                                    reason: $scope.changeReason,
                                    date: new Date(),
                                    userId: currentUser._id,
                                    userName: currentUser.fullName
                                };
                                shipTicket.deleted = true;
                                delete shipTicket.__v;
                                await ngivrHttp.put('api/tickets/' + shipTicket._id, shipTicket);
                                for (let ledger of shipTicket.ledger) {
                                    let resp = await ngivrApi.query('orderVehicle', {search: {$or: [{outTicket: ledger.subTicketName}, {inTicket: ledger.subTicketName}]}});
                                    let vehicle = resp.data.docs[0];
                                    if (!vehicle.tcn) {
                                        vehicle.ticketDeleted = true;

                                    }

                                    if (vehicle.tcn) {
                                        vehicle.tcnUsed = false;

                                        vehicle.inTicketDeleted = true;
                                        if (shipTicket.direction === 'out') {
                                            vehicle.outTicketDeleted = true
                                        }


                                    }
                                    await ngivrApi.save('orderVehicle', vehicle);
                                    ngivrGrowl('A hajóból kikerült az áru.')
                                }
                            }
                            return shipTicket
                        } catch (e) {
                            return (e)

                        }

                    };

                    /**
                     * Bteszi a terméket a hajóba
                     * @param shipTicket
                     * @returns {Promise<*>}
                     */
                    $scope.takeProductToShip = async (shipTicket) => {
                        try {
                            let resp = await ngivrApi.query('orderVehicle', {search: {outTicket: shipTicket.ledger[0].subTicketName}});
                            let outVehicle = resp.data.docs[0];
                            if (!$scope.model.targetDepot) {
                                let resp = await ngivrApi.id('order', $scope.model.dstOrder.parentOrderId);
                                let afkOrder = resp.data.doc;

                                await $scope.setShipTicket(shipTicket, afkOrder);
                                // await $scope.fillLedgerFromDispo(shipTicket.ledger[0], afkOrder);
                                shipTicket.ledger[0].orderId = afkOrder._id;
                                shipTicket.ledger[0].orderNumber = afkOrder.orderNumber;
                                shipTicket.ledger[0].shipId = $scope.model.ship._id;
                                shipTicket.ledger[0].shipName = $scope.model.ship.name;
                                shipTicket.ledger[0].sourceServiceContractId = $scope.model.dstOrder.sourceServiceContractId;
                                shipTicket.ledger[0].numberOfPackings = $scope.ticket.ledger[0].numberOfPackings;
                                shipTicket.deleted = false;
                                shipTicket.changed = true;
                                shipTicket.change = angular.copy(shipTicket.delete);
                                shipTicket.doNotCalcOldDepot = true;
                                delete shipTicket.delete;
                                await ngivrHttp.put('api/tickets/' + shipTicket._id, shipTicket);
                                await $scope.modifyVehicle(outVehicle, afkOrder);
                            } else {
                                outVehicle.deleted = true;
                                await ngivrApi.save('orderVehicle', outVehicle)
                            }
                            return true
                        } catch (e) {
                            return (e)
                        }

                    };

                    /**
                     * internal_out ticketet módosítja
                     * @param currentUser
                     * @returns {Promise<*>}
                     */
                    $scope.modifyInternalOutTicket = async (currentUser) => {
                        try {
                            let resp = await ngivrApi.query('ticket', {search: {'ledger.subTicketName': vehicle.outTicket}});
                            let outTicket = resp.data.docs[0];
                            await $scope.setTicket(outTicket);
                            await $scope.fillLedgerFromDispo(outTicket.ledger[0], $scope.model.dstOrder);
                            outTicket.change = {
                                reason: $scope.changeReason,
                                date: new Date(),
                                userId: currentUser._id,
                                userName: currentUser.fullName
                            };
                            outTicket.changed = true;
                            await ngivrHttp.put('api/tickets/' + outTicket._id, outTicket);
                            return true
                        } catch (e) {
                            return e
                        }

                    };

                    const setVehicleUnPerformed = (vehicle) => {
                        vehicle.arrivalDate = null;
                        vehicle.unloadedWeight = null;
                        vehicle.inTicket = null;
                        vehicle.depot = null;
                        vehicle.tcnUsed = false;

                    };

                    /**
                     * Játművet módosítja
                     * @param vehicle
                     * @param order
                     * @param changeVehicle
                     * @returns {Promise<void>}
                     */
                    $scope.modifyVehicle = async (vehicle, order = $scope.model.dstOrder, changeVehicle) => {
                        if (!vehicle) {
                            let subTicketName = $scope.ticket.ledger[0].subTicketName;
                            let resp = await ngivrApi.query('orderVehicle', {search: {$or: [{inTicket: subTicketName}, {outTicket: subTicketName}]}});
                            vehicle = resp.data.docs[0];
                        }

                        // ha másik járműre teljesítünk, akkor az eredeti járművet "teljesítetlenné kell tenni
                        // a kiválasztott jármű megkapja az eredeti fel-lerakó mennyiségét és egyéb szükséges adatait
                        if ($scope.model.selectedVehicle && changeVehicle) {
                            console.warn('selected', $scope.model.selectedVehicle);
                            console.warn('vehicle', vehicle);
                            $scope.model.selectedVehicle.arrivalDate = vehicle.arrivalDate;
                            $scope.model.selectedVehicle.loadedWeight = vehicle.loadedWeight;
                            $scope.model.selectedVehicle.unloadedWeight = vehicle.unloadedWeight;
                            $scope.model.selectedVehicle.inTicket = vehicle.inTicket;
                            $scope.model.selectedVehicle.orderId = order._id;
                            $scope.model.selectedVehicle.tcnUsed = true;
                            $scope.model.selectedVehicle.depot = {
                                depotName: $scope.ticket.depot.name,
                                depotId: $scope.ticket.depot.depotId
                            };
                            setVehicleUnPerformed(vehicle);
                            await ngivrApi.save('orderVehicle', $scope.model.selectedVehicle)

                        } else if ($scope.model.keepVehicle) {
                            //eredeti jármű legyen teljesítetlen, és jöjjön létre egy új jármű
                            let newVehicle = angular.copy(vehicle);
                            delete newVehicle._id;
                            delete newVehicle.__v;
                            delete newVehicle.createdAt;
                            delete newVehicle.updatedAt;
                            delete newVehicle.tcn;
                            delete newVehicle.tcnStatus;
                            newVehicle.inTicket = vehicle.inTicket;
                            newVehicle.outTicket = vehicle.outTicket;
                            newVehicle.orderId = order._id;
                            newVehicle.tcnUsed = false;
                            newVehicle.depot = {
                                depotName: $scope.ticket.depot.name,
                                depotId: $scope.ticket.depot.depotId
                            };
                            setVehicleUnPerformed(vehicle);
                            await ngivrApi.save('orderVehicle', newVehicle)
                        } else {
                            vehicle.ticketDeleted = false;
                            vehicle.orderId = order._id;
                            vehicle.depot = {
                                depotName: $scope.ticket.depot.name,
                                depotId: $scope.ticket.depot.depotId
                            };

                        }
                        await ngivrApi.save('orderVehicle', vehicle)

                    };

                    /**
                     * Beállítja a ticket értékeit
                     * @param ticket
                     * @param dstOrder
                     * @returns {Promise<void>}
                     */
                    $scope.setTicket = async (ticket = $scope.ticket, dstOrder = $scope.model.dstOrder) => {
                        ticket.productId = dstOrder.orderProduct.length ? dstOrder.orderProduct[0]._id : $scope.model.dstOrder.orderProduct[0]._id;
                        ticket.productName = dstOrder.orderProduct.length ? dstOrder.orderProduct[0].name : $scope.model.dstOrder.orderProduct[0].name;
                        ticket.carrier = dstOrder.carrier || $scope.model.dstOrder.carrier;
                        ticket.productParams = dstOrder.productParams || $scope.model.dstOrder.productParams;
                        ticket.sygnus = dstOrder.sygnus;

                        if ($scope.model.dstOrder.direction === 'internal') {
                            if ($scope.ticket.direction !== ticket.direction) {
                                if ($scope.ticket.direction === 'internal_in') {
                                    ticket.direction = 'internal_out'
                                } else {
                                    ticket.direction = 'internal_in'
                                }
                            } else {
                                if ($scope.model.dstOrder.loadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                    ticket.direction = 'internal_out'
                                } else if ($scope.model.dstOrder.unloadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                    ticket.direction = 'internal_in'
                                }
                            }

                        } else {
                            if ($scope.model.dstOrder.intShip) {
                                if ($scope.model.dstOrder.loadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                    ticket.direction = 'internal_out'
                                } else if ($scope.model.dstOrder.unloadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                    ticket.direction = 'internal_in'
                                }
                            } else {
                                ticket.direction = $scope.model.dstOrder.direction
                            }

                        }

                        if ($scope.model.dstOrder.shipOnType) {
                            ticket.targetDepot = $scope.model.targetDepot;
                            if ($scope.model.dstOrder.shipOnType) {
                                ticket.ship = $scope.model.ship;

                                ticket.actualQuayBerth = $scope.model.ship ? $scope.model.ship.quayBerth : undefined
                            }
                            if ($scope.model.targetDepot) {
                                ticket.ship = undefined;
                                ticket.actualQuayBerth = undefined;
                                ticket.depot.depotId = $scope.model.depotFull._id;
                                ticket.depot.name = $scope.model.depotFull.name;
                                if (!ticket.sygnus) {
                                    ticket.direction = 'in'
                                }
                            }
                        }

                        switch ($scope.model.dstOrder.direction) {
                            case 'in':
                                ticket.depot.name = $scope.model.depotFull ? $scope.model.depotFull.name : $scope.model.dstOrder.unloadDepot[0].name;
                                ticket.depot.depotId = $scope.model.depotFull ? $scope.model.depotFull._id : $scope.model.dstOrder.unloadDepot[0]._id;
                                ticket.site.name = $scope.model.dstOrder.unloadLocation[0].name;
                                ticket.site.siteId = $scope.model.dstOrder.unloadLocation[0]._id;
                                break;

                            case 'out':
                                if (!$scope.model.dstOrder.intShip) {
                                    let depotPromise = await ngivrApi.id('depot', $scope.model.dstOrder.loadDepot[0].depot);
                                    let depot = depotPromise.data.doc;
                                    ticket.depot.name = depot.name;
                                    ticket.depot.depotId = depot._id;
                                    ticket.site.name = depot.site[0].name;
                                    ticket.site.siteId = depot.site[0]._id;

                                    // await $scope.setDepotsWithProduct($scope.model.dstOrder, ticket.ledger[0]);
                                } else {
                                    if ($scope.model.dstOrder.loadLocation[0] !== undefined && $scope.model.dstOrder.loadLocation[0]._id === $rootScope.weighingHouse.site._id) { //TODO Ide még kell a felrakó raktár is
                                        let depotPromise = await ngivrApi.id('depot', $scope.model.dstOrder.loadDepot[0].depot);
                                        let depot = depotPromise.data.doc;
                                        ticket.depot.name = depot.name;
                                        ticket.depot.depotId = depot._id;
                                        ticket.site.name = depot.site[0].name;
                                        ticket.site.siteId = depot.site[0]._id;

                                        //await $scope.setDepotsWithProduct($scope.model.dstOrder, ticket.ledger[0]);

                                    } else if ($scope.model.dstOrder.unloadLocation[0] !== undefined && $scope.model.dstOrder.unloadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                        ticket.site.name = $scope.model.dstOrder.unloadLocation[0].name;
                                        ticket.site.siteId = $scope.model.dstOrder.unloadLocation[0]._id;
                                        ticket.depot.name = $scope.model.dstOrder.unloadDepot[0].name;
                                        ticket.depot.depotId = $scope.model.dstOrder.unloadDepot[0]._id;

                                        //await $scope.setDepotsWithProduct($scope.model.dstOrder, ticket.ledger[0]);
                                    }
                                }


                                break;

                            case 'external_in': // ha hajóba megy, akkor ne legyen raktár a ticketben
                                if ($scope.model.dstOrder.unloadLocation[0] !== undefined) {
                                    ticket.site.name = $scope.model.dstOrder.unloadLocation[0].name;
                                    ticket.site.siteId = $scope.model.dstOrder.unloadLocation[0]._id
                                } else if ($scope.model.dstOrder.unloadLocation[0] === undefined) {
                                    ticket.site.name = $scope.model.cargoPlan.loadPlace[0].name;
                                    ticket.site.siteId = $scope.model.cargoPlan.loadPlace[0]._id
                                }
                                if ($scope.model.targetDepot) {
                                    ticket.depot = {
                                        name: $scope.model.depotFull.name,
                                        depotId: $scope.model.depotFull._id
                                    };
                                } else {
                                    ticket.depot = {name: null, depotId: null};
                                }

                                break;

                            case 'external_out':
                                if ($scope.model.dstOrder.loadLocation[0] !== undefined) {
                                    ticket.site.name = $scope.model.dstOrder.loadLocation[0].name;
                                    ticket.site.siteId = $scope.model.dstOrder.loadLocation[0]._id;
                                }
                                break;

                            case 'internal':
                                if ($scope.ticket.direction === ticket.direction) {
                                    if ($scope.model.dstOrder.loadLocation[0] !== undefined && $scope.model.dstOrder.loadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                        let depotPromise = await ngivrApi.id('depot', $scope.model.dstOrder.loadDepot[0].depot);
                                        let depot = depotPromise.data.doc;
                                        ticket.depot.name = depot.name;
                                        ticket.depot.depotId = depot._id;
                                        ticket.site.name = depot.site[0].name;
                                        ticket.site.siteId = depot.site[0]._id;

                                        //await $scope.setDepotsWithProduct($scope.model.dstOrder, ticket.ledger[0]);

                                    } else if ($scope.model.dstOrder.unloadLocation[0] !== undefined && $scope.model.dstOrder.unloadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                        if (!$scope.model.targetDepot) {
                                            ticket.site.name = $scope.model.dstOrder.unloadLocation[0].name;
                                            ticket.site.siteId = $scope.model.dstOrder.unloadLocation[0]._id;
                                            ticket.depot.name = $scope.model.dstOrder.unloadDepot[0].name;
                                            ticket.depot.depotId = $scope.model.dstOrder.unloadDepot[0]._id;
                                        }


                                        //await $scope.setDepotsWithProduct($scope.model.dstOrder, ticket.ledger[0]);
                                    }
                                } else {
                                    if ($scope.ticket.direction === 'internal_in') {
                                        let depotPromise = await ngivrApi.id('depot', $scope.model.dstOrder.loadDepot[0].depot);
                                        let depot = depotPromise.data.doc;
                                        ticket.depot.name = depot.name;
                                        ticket.depot.depotId = depot._id;
                                        ticket.site.name = depot.site[0].name;
                                        ticket.site.siteId = depot.site[0]._id;
                                    } else {
                                        if (!$scope.model.targetDepot) {
                                            ticket.site.name = $scope.model.dstOrder.unloadLocation[0].name;
                                            ticket.site.siteId = $scope.model.dstOrder.unloadLocation[0]._id;
                                            ticket.depot.name = $scope.model.dstOrder.unloadDepot[0].name;
                                            ticket.depot.depotId = $scope.model.dstOrder.unloadDepot[0]._id;
                                        }
                                    }
                                }

                                break;
                        }


                        if (ticket.depot && ticket.depot.depotId) {
                            let response = await ngivrApi.id('depot', ticket.depot.depotId);
                            ticket.depotFull = response.data.doc;
                        }

                        ticket.contractId = $scope.model.dstOrder.contractId;
                        ticket.sustainability = $scope.model.dstOrder.sustainability;
                        // ticket.ownerId = (typeof $scope.model.dstOrder.partner[0] == 'undefined') ? ($scope.model.dstOrder.hasOwnProperty('seller') ? $scope.model.dstOrder.seller._id : null) : ($scope.model.dstOrder.partner[0]._id);
                        // ticket.ownerName = (typeof $scope.model.dstOrder.partner[0] == 'undefined') ? ($scope.model.dstOrder.hasOwnProperty('seller') ? $scope.model.dstOrder.seller.name : null) : ($scope.model.dstOrder.partner[0].name );
                        //ticket.tcn = $scope.model.dstOrder.tcn;
                        ticket.putInBags = $scope.model.dstOrder.putInBags;
                        ticket.vehicles = $scope.model.dstOrder.vehicles;

                        if (!ticket.sygnus) {
                            if ($scope.model.dstOrder.hasOwnProperty('partner') && $scope.model.dstOrder.partner.length === 1) {
                                ticket.ownerId = $scope.model.dstOrder.partner[0]._id;
                                ticket.ownerName = $scope.model.dstOrder.partner[0].name;
                            }
                        } else {
                            let response = await ngivrService.api.id('partner', ngivr.settings.ownFirm._id);
                            const firm = response.data.doc;
                            ticket.ownerId = firm._id;
                            ticket.ownerName = firm.name;
                            // })
                        }

                        if (ticket.productId === null && $scope.model.dstOrder.bfkd) {
                            ngivrService.api.id('cargoPlan', $scope.model.dstOrder.cargoPlanId, {populate: ngivr.settings.populate.cargoPlan}).then(function (response) {
                                const cargo = response.data.doc;
                                ticket.productId = cargo.sellContracts[0].productId;
                                ticket.productName = cargo.sellContracts[0].productName;
                            })
                        }

                        if (ticket.putInBags) {
                            $scope.selectPartnerToolkit($scope.model.dstOrder.partnerToolkit[0], 0);

                        }
                        //Ha az orderben nincsenek meg bizonyos adatok, akkor a hozza tartozo contract alapjan töltjük ki
                        if ($scope.model.dstOrder.contractId !== null && $scope.model.dstOrder.contractId !== undefined) {
                            $http.get('api/contracts/' + $scope.model.dstOrder.contractId).then(function (contract) {
                                contract = contract.data;
                                if ($scope.model.dstOrder.sustainability === '') {
                                    ticket.sustainability = contract.sustainability;
                                }
                            }).catch(function () {
                                ngivr.growl('Szerződések betöltése nem sikerült', 'error');
                            });
                        }
                    };

                    /**
                     * Hajós ticketet állítja be
                     * @param ticket
                     * @param dstOrder
                     * @returns {Promise<void>}
                     */
                    $scope.setShipTicket = async (ticket = $scope.ticket, dstOrder = $scope.model.dstOrder) => {
                        ticket.productId = $scope.model.dstOrder.orderProduct[0]._id;
                        ticket.productName = $scope.model.dstOrder.orderProduct[0].name;
                        ticket.carrier = $scope.ticket.carrier;
                        ticket.productParams = $scope.ticket.productParams;
                        ticket.sygnus = $scope.ticket.sygnus;


                        if ($scope.model.dstOrder.shipOnType) {
                            ticket.targetDepot = $scope.model.targetDepot;
                            if ($scope.model.dstOrder.shipOnType) {
                                ticket.ship = $scope.model.ship
                            }
                            if ($scope.model.targetDepot) {
                                ticket.ship = undefined;
                                ticket.depot.depotId = $scope.model.depotFull._id;
                                ticket.depot.name = $scope.model.depotFull.name;

                            }
                        }


                        ticket.site.name = $scope.model.dstOrder.unloadLocation[0].name;
                        ticket.site.siteId = $scope.model.dstOrder.unloadLocation[0]._id;
                        ticket.depot.name = $scope.model.dstOrder.unloadDepot[0].name;
                        ticket.depot.depotId = $scope.model.dstOrder.unloadDepot[0]._id;


                        if (ticket.depot && ticket.depot.depotId) {
                            let response = await ngivrApi.id('depot', ticket.depot.depotId);
                            ticket.depotFull = response.data.doc;
                        }

                        ticket.contractId = $scope.model.dstOrder.contractId;
                        ticket.sustainability = $scope.model.dstOrder.sustainability;
                        // ticket.ownerId = (typeof $scope.model.dstOrder.partner[0] == 'undefined') ? ($scope.model.dstOrder.hasOwnProperty('seller') ? $scope.model.dstOrder.seller._id : null) : ($scope.model.dstOrder.partner[0]._id);
                        // ticket.ownerName = (typeof $scope.model.dstOrder.partner[0] == 'undefined') ? ($scope.model.dstOrder.hasOwnProperty('seller') ? $scope.model.dstOrder.seller.name : null) : ($scope.model.dstOrder.partner[0].name );
                        //ticket.tcn = $scope.model.dstOrder.tcn;
                        ticket.putInBags = $scope.model.dstOrder.putInBags;
                        ticket.vehicles = $scope.model.dstOrder.vehicles;

                        if (!ticket.sygnus) {
                            if ($scope.model.dstOrder.hasOwnProperty('partner') && $scope.model.dstOrder.partner.length === 1) {
                                ticket.ownerId = $scope.model.dstOrder.partner[0]._id;
                                ticket.ownerName = $scope.model.dstOrder.partner[0].name;
                            }
                        } else {
                            let response = await ngivrService.api.id('partner', ngivr.settings.ownFirm._id);
                            const firm = response.data.doc;
                            ticket.ownerId = firm._id;
                            ticket.ownerName = firm.name;
                            // })
                        }

                        if (ticket.productId === null && $scope.model.dstOrder.bfkd) {
                            ngivrService.api.id('cargoPlan', $scope.model.dstOrder.cargoPlanId, {populate: ngivr.settings.populate.cargoPlan}).then(function (response) {
                                const cargo = response.data.doc;
                                ticket.productId = cargo.sellContracts[0].productId;
                                ticket.productName = cargo.sellContracts[0].productName;
                            })
                        }

                        if (ticket.putInBags) {
                            $scope.selectPartnerToolkit($scope.model.dstOrder.partnerToolkit[0], 0);

                        }
                        //Ha az orderben nincsenek meg bizonyos adatok, akkor a hozza tartozo contract alapjan töltjük ki
                        if ($scope.model.dstOrder.contractId !== null && $scope.model.dstOrder.contractId !== undefined) {
                            $http.get('api/contracts/' + $scope.model.dstOrder.contractId).then(function (contract) {
                                contract = contract.data;
                                if ($scope.model.dstOrder.sustainability === '') {
                                    ticket.sustainability = contract.sustainability;
                                }
                            }).catch(function () {
                                ngivr.growl('Szerződések betöltése nem sikerült', 'error');
                            });
                        }
                    };


                    /**
                     * A ticket ledger-ét tölti ki a megadott order alapján
                     * @param ledger
                     * @param dispo
                     * @param internalTransfer
                     * @returns {Promise<*>}
                     */
                    $scope.fillLedgerFromDispo = async function (ledger, dispo, internalTransfer) {

                        if (dispo.hasOwnProperty('partner') && dispo.partner.length === 1 && dispo.partner[0] !== null) {
                            ledger.partnerName = dispo.partner[0].name;
                        }
                        else {
                            if ((dispo.direction === 'in' || dispo.direction === 'external_in') && dispo.hasOwnProperty('seller')) {
                                ledger.partnerName = dispo.seller.name;
                            } else if ((dispo.direction === 'out' || dispo.direction === 'external:out') && dispo.hasOwnProperty('destination')) {
                                ledger.partnerName = dispo.destination.name;
                            } else if (ledger.dispo.contractId) {

                                let contractResponse = await ngivrApi.id('contract', ledger.dispo.contractId);
                                ledger.partnerName = contractResponse.data.doc.partner[0].name

                            } else if ((dispo.direction === 'internal_out' || dispo.direction === 'internal_in' || (dispo.direction === 'out' && dispo.intShip)) && dispo.sygnus) {

                                ngivrService.api.id('partner', ngivr.settings.ownFirm._id).then(function (response) {
                                    const firm = response.data.doc;
                                    ledger.partnerName = firm.name;
                                })
                            }
                        }
                        if ($scope.model.dstOrder.shipOnType === 'pkb' && $scope.model.targetDepot) {
                            ledger.direction = 'in'
                        }

                        ledger.loadLocation = dispo.loadLocation[0];
                        ledger.loadLocationSettlement = dispo.loadLocationSettlement;
                        ledger.productId = (typeof dispo.orderProduct[0] === 'undefined') ? (null) : (dispo.orderProduct[0]._id);
                        ledger.productName = (typeof dispo.orderProduct[0] === 'undefined') ? (null) : (dispo.orderProduct[0].name);
                        ledger.shipOnType = dispo.shipOnType;
                        if (!ledger.depot) {
                            ledger.depot = {};
                        }
                        if (!ledger.site) {
                            ledger.site = {};
                        }

                        // ledger.site = {
                        //     name: dispo.unloadLocation[0].name,
                        //     siteId: dispo.unloadLocation[0]._id
                        // }

                        switch (dispo.direction) {
                            case 'in':
                                if (!$scope.model.targetDepot) {
                                    ledger.depot.name = dispo.unloadDepot[0].name;
                                    ledger.depot.depotId = dispo.unloadDepot[0]._id;
                                    ledger.site.name = dispo.unloadLocation[0].name;
                                    ledger.site.siteId = dispo.unloadLocation[0]._id;
                                }

                                break;

                            case 'out':
                                if (!dispo.intShip) {
                                    //let depotPromise = await ngivrApi.id('depot', $s);
                                    //let depot = depotPromise.data.doc;
                                    ledger.depot.name = $scope.ticket.depot.name;
                                    ledger.depot.depotId = $scope.ticket.depot.depotId;
                                    ledger.site.name = $scope.model.depotFull.site[0].name;
                                    ledger.site.siteId = $scope.model.depotFull.site[0]._id;

                                    //await $scope.setDepotsWithProduct(dispo, ledger);
                                } else {
                                    if (dispo.loadLocation[0] !== undefined && dispo.loadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                        let depotPromise = await ngivrApi.id('depot', ledger.depot.depotId || dispo.loadDepot[0].depot);
                                        let depot = depotPromise.data.doc;
                                        ledger.depot.name = depot.name;
                                        ledger.depot.depotId = depot._id;
                                        ledger.site.name = depot.site[0].name;
                                        ledger.site.siteId = depot.site[0]._id;

                                        //    await $scope.setDepotsWithProduct(dispo, ledger);

                                    } else if (dispo.unloadLocation[0] !== undefined && dispo.unloadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                        ledger.site.name = dispo.unloadLocation[0].name;
                                        ledger.site.siteId = dispo.unloadLocation[0]._id;
                                        ledger.depot.name = dispo.unloadDepot[0].name;
                                        ledger.depot.depotId = dispo.unloadDepot[0]._id;

                                        //     await $scope.setDepotsWithProduct(dispo, ledger);
                                    }
                                }


                                break;

                            case 'external_in':
                                if (dispo.unloadLocation[0] !== undefined) {
                                    ledger.site.name = dispo.unloadLocation[0].name;
                                    ledger.site.siteId = dispo.unloadLocation[0]._id
                                } else if (dispo.unloadLocation[0] === undefined) {
                                    ledger.site.name = $scope.model.cargoPlan.loadPlace[0].name;
                                    ledger.site.siteId = $scope.model.cargoPlan.loadPlace[0]._id
                                }
                                break;

                            case 'external_out':
                                if (dispo.loadLocation[0] !== undefined) {
                                    ledger.site.name = dispo.loadLocation[0].name;
                                    ledger.site.siteId = dispo.loadLocation[0]._id;
                                }
                                break;

                            case 'internal':
                                if (dispo.loadLocation[0] !== undefined && dispo.loadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                    let depotPromise = await ngivrApi.id('depot', ledger.depot.depotId || dispo.loadDepot[0].depot);
                                    let depot = depotPromise.data.doc;
                                    ledger.depot.name = depot.name;
                                    ledger.depot.depotId = depot._id;
                                    ledger.site.name = depot.site[0].name;
                                    ledger.site.siteId = depot.site[0]._id;

                                    //await $scope.setDepotsWithProduct(dispo, ledger);

                                } else if (dispo.unloadLocation[0] !== undefined && dispo.unloadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                    ledger.site.name = dispo.unloadLocation[0].name;
                                    ledger.site.siteId = dispo.unloadLocation[0]._id;
                                    ledger.depot.name = dispo.unloadDepot[0].name;
                                    ledger.depot.depotId = dispo.unloadDepot[0]._id;

                                    //await $scope.setDepotsWithProduct(dispo, ledger);
                                }
                                break;
                        }


                        if (ledger.depot && ledger.depot.depotId) {
                            let response = await ngivrApi.id('depot', ledger.depot.depotId);
                            ledger.depotFull = response.data.doc;
                        }

                        if (dispo.direction === 'internal') {
                            if (dispo.loadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                ledger.direction = 'internal_out'
                            } else if (dispo.unloadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                ledger.direction = 'internal_in'
                            }
                        } else {
                            if (dispo.intShip) {
                                if (dispo.loadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                    ledger.direction = 'internal_out'
                                } else if (dispo.unloadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                    ledger.direction = 'internal_in'
                                }
                            } else {
                                ledger.direction = $scope.ticket.direction
                            }

                        }


                        if (dispo.partnerPartner) {
                            ledger.partnerPartner = dispo.partnerPartner
                        }

                        // sygnus: true , direction: in
                        if (dispo.sygnus === true && dispo.direction === 'in') {
                            ledger.contractId = dispo.contractId;
                            ledger.invoiceId = null;
                            ledger.stornoInvoiceId = null;
                            ledger.needContract = false;
                            ledger.needInvoice = true;
                        }

                        // sygnus: true , direction: out
                        if (dispo.sygnus === true && dispo.direction === 'out') {
                            ledger.contractId = dispo.contractId;
                            ledger.invoiceId = null;
                            ledger.stornoInvoiceId = null;
                            ledger.needContract = false;
                            ledger.needInvoice = true;
                        }

                        //Sygnus: true, internalTransfer=true, in és out
                        if (dispo.sygnus === true && internalTransfer === true) {
                            ledger.contractId = null;
                            ledger.invoiceId = null;
                            ledger.stornoInvoiceId = null;
                            ledger.needContract = false;
                            ledger.needInvoice = false;
                        }

                        //Sygnus: false
                        if (dispo.sygnus === false) {
                            ledger.contractId = null;
                            ledger.invoiceId = null;
                            ledger.stornoInvoiceId = null;
                            ledger.needContract = false;
                            ledger.needInvoice = true;
                        }

                        ledger.dispo = dispo;
                        ledger.orderId = dispo._id;
                        ledger.orderNumber = dispo.orderNumber;
                        ledger.actualServiceContractId = dispo.actualServiceContract;
                        ledger.sourceServiceContractId = dispo.sourceServiceContractId;

                        //ServicePrice tomb feltöltés. Ami null, az szerveren lesz kitöltve
                        if (dispo.bagFilling !== null) {
                            ledger.servicePrice.push({
                                serviceType: ngivr.strings.serviceType.bagFilling, // Szolgáltatás típusa -> ngivr.strings.js
                                price: null, //ár
                                currency: null, //deviza
                                invoiceId: null //számla id
                            })
                        }
                        if (dispo.depotLoading !== null) {
                            ledger.servicePrice.push({
                                serviceType: ngivr.strings.serviceType.depotLoading, // Szolgáltatás típusa -> ngivr.strings.js
                                price: null, //ár
                                currency: null, //deviza
                                invoiceId: null //számla id
                            })
                        }
                        if (dispo.shipLoading !== null) {
                            ledger.servicePrice.push({
                                serviceType: ngivr.strings.serviceType.shipLoading, // Szolgáltatás típusa -> ngivr.strings.js
                                price: null, //ár
                                currency: null, //deviza
                                invoiceId: null //számla id
                            })
                        }
                        if (dispo.shipUnloading !== null) {
                            ledger.servicePrice.push({
                                serviceType: ngivr.strings.serviceType.shipUnloading, // Szolgáltatás típusa -> ngivr.strings.js
                                price: null, //ár
                                currency: null, //deviza
                                invoiceId: null //számla id
                            })
                        }
                        if (dispo.truckLoading !== null) {
                            ledger.servicePrice.push({
                                serviceType: ngivr.strings.serviceType.truckLoading, // Szolgáltatás típusa -> ngivr.strings.js
                                price: null, //ár
                                currency: null, //deviza
                                invoiceId: null //számla id
                            })
                        }

                        // if ($scope.viewOpts.ticketType === 'half') {
                        //   $scope.ticket.ticketType = 'scale';
                        // }

                        //ledger.parityId = dispo.parityId;

                        ledger.parityId = dispo.parityId;
                        ledger.parityName = dispo.parityName;

                        ledger.paritySettlementId = dispo.paritySettlementId;
                        ledger.paritySettlementName = dispo.paritySettlementName;

                        ledger.parityFobDestinationId = dispo.parityFobDestinationId;
                        ledger.parityFobDestinationName = dispo.parityFobDestinationName;

                        ledger.needContract = dispo.needContract;

                        return ledger;
                    };

                    $scope.setTransportType = async (order) => {
                        let transportType = undefined;
                        if (order) {
                            if (order.sygnus) {
                                if (order.direction === 'out') {
                                    if (order.cargoPlanId) {
                                        const resp = await ngivrApi.id('cargoPlan', order.cargoPlanId);
                                        const cargoPlan = resp.data.doc;
                                        if (!order.intShip) {
                                            if (cargoPlan.transportType === 'truck') {
                                                transportType = 'Sygnus kitárolás'
                                            } else {
                                                transportType = 'Sygnus hajórakodás'
                                            }
                                        } else {
                                            let loadType;
                                            if (order.loadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                                loadType = 'felrakodás'
                                            } else if (order.unloadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                                loadType = 'lerakodás'
                                            }
                                            transportType = 'Sygnus hajórakodás belső áttárolásból, ' + loadType
                                        }

                                    } else {
                                        transportType = 'Sygnus kitárolás'
                                    }
                                } else if (order.direction === 'in') {
                                    if (order.cargoPlanId) {
                                        transportType = 'Sygnus hajórakodás vételi szerződésből'
                                    } else {
                                        transportType = 'Sygnus betárolás'
                                    }
                                } else if (order.direction === 'internal') {
                                    let loadType;
                                    if (order.loadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                        loadType = 'felrakodás'
                                    } else if (order.unloadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                        loadType = 'lerakodás'
                                    }
                                    if (order.cargoPlanId) {
                                        transportType = 'Sygnus hajórakodás belső áttárolásból, ' + loadType
                                    } else {
                                        transportType = 'Sygnus belső áttárolás, ' + loadType
                                    }
                                }

                            } else {
                                if (order.direction === 'out') {
                                    if (order.cargoPlanId) {

                                        if (!order.intShip) {
                                            transportType = 'Partner hajórakodás tárházból'
                                        } else {
                                            let loadType;
                                            if (order.loadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                                loadType = 'felrakodás'
                                            } else if (order.unloadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                                loadType = 'lerakodás'
                                            }
                                            transportType = 'Partner hajórakodás belső áttárolásból, ' + loadType
                                        }

                                    } else {
                                        transportType = 'Partner kitárolás'
                                    }
                                } else if (order.direction === 'in') {
                                    transportType = 'Partner betárolás'

                                } else if (order.direction === 'external_in') {
                                    transportType = 'Partner külső hajórakodás'

                                } else if (order.direction === 'internal') {
                                    let loadType;
                                    if (order.loadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                        loadType = 'felrakodás'
                                    } else if (order.unloadLocation[0]._id === $rootScope.weighingHouse.site._id) {
                                        loadType = 'lerakodás'
                                    }
                                    if (order.cargoPlanId) {
                                        transportType = 'Partner hajórakodás belső áttárolásból, ' + loadType
                                    } else {
                                        transportType = 'Partner belső áttárolás, ' + loadType
                                    }
                                }

                            }
                        }
                        return transportType
                    };

                    $scope.setSelectedVehiclesToNull = () => {
                        $scope.model.selectedVehicle = undefined
                    };

                    $scope.model.origOrder.transportType = await $scope.setTransportType($scope.model.origOrder)
                };

                start()


            }
        }
    }
});
