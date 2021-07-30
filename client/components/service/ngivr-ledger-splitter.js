'use strict';
ngivr.angular.factory('ngivrLedgerSplitter', function (ngivrHttp, ngivrService, $http, ngivrGrowl, ngivrApi, Common, ngivrException, ngivrTicket) {

    let ngivrLedgerSplitterFactory = {};

    /**
     * Két diszpozíció között osztjuk el a ledger elemet
     * options object:
     * ticket - ticket amiből leszedünk
     * ledgerIndex - régi ledger sorszáma amiből leszedünk
     * orderNumber - új dispo amire rakjuk
     * value - új ledger értéke amit le kell szedni a régiről
     * cb
     * @param options
     */
    let splitLedgerToDifferentDispoFunc = async (options) => {
        const {ticket, ledgerIndex, orderNumber, value, direction, splitWeight, cb} = options;
        // itt már tudni kell, hogy fel- vagy lerakott súlyt módosítunk
        let ledgerId = ticket.ledger[ledgerIndex]._id; //a megosztandó ledger id-ja
        let resp = await ngivrApi.id('ticket', ticket._id);
        let fullTicket = resp.data.doc; //a teljes ticket, nem biztos, hogy kell, hiszen már megvan

        let fullLedgerIndex = Common.functiontofindIndexByKeyValue(fullTicket.ledger, '_id', ledgerId); //megkeressük a ledger index-ét (elvileg ezt már tudjuk)

        let fromOrder = {}; //itt lesz az az order tárolva, amihez a megosztandó ledger tartozik

        if (checkParam(fullTicket, fullLedgerIndex, value)) {
            if (cb) {
                return cb();
            }
            return;
        }

        if (orderNumber === undefined) {
            ngivrGrowl('OrderNumber is missing');
            if (cb) {
                return cb();
            }
            return;
        }

        //to order paritása egyezik e a kiinduló orderevel
        let request = {
            //OrderNumber: ticket.ledger[ledgerIndex].orderNumber,
            _id: fullTicket.ledger[fullLedgerIndex].orderId,
            deleted: false,
        };
        $http.get('/api/orders/', {params: request}).then(function (response) {
            fromOrder = response.data[0];
            if (fromOrder.closed) {
                ngivrGrowl('A forrás diszpozíció le lett zárva');
                if (cb) {
                    return cb();
                }
                return;
            }
            if (fromOrder.deleted) {
                ngivrGrowl('A forrás diszpozíció törölve lett');
                if (cb) {
                    return cb();
                }
                return;
            }
            let request = {
                orderNumber: orderNumber,
                deleted: false,
            };
            $http.get('/api/orders/', {params: request}).then(async function (response) {
                let order = response.data[0]; //az order, amire átpakolunk

                if (order.closed) {
                    ngivrGrowl('A cél diszpozíció le lett zárva');
                    if (cb) {
                        return cb();
                    }
                    return;
                }
                if (order.deleted) {
                    ngivrGrowl('A cél diszpozíció törölve lett');
                    if (cb) {
                        return cb();
                    }
                    return;
                }

                if (fromOrder.direction !== 'internal' && fromOrder.sygnus && order.sygnus) {
                    if (fromOrder.parityId !== order.parityId) { //paritásnak egyezni kell
                        ngivrGrowl('The parity is not the same');
                        if (cb) {
                            return cb();
                        }
                        return;
                    }
                } else if (fromOrder.direction === 'internal') {

                } else {
                    if (value !== direction === 'in' ? fullTicket.ledger[fullLedgerIndex].loadedWeight : fullTicket.ledger[fullLedgerIndex].unloadedWeight) {
                        ngivrGrowl('A teljes mennyiséget fel kell osztani!');
                        if (cb) {
                            return cb();
                        }
                        return;
                    }
                }


                if (fromOrder.direction !== 'internal' && fromOrder.direction !== order.direction) { //iránynak egyezni kell
                    ngivrGrowl('The direction is not the same');
                    if (cb) {
                        return cb();
                    }
                    return;
                }

                if (fromOrder.direction !== 'internal') {
                    splitLedger({
                        splitWeight: splitWeight,
                        ticket: fullTicket,
                        ledgerIndex: fullLedgerIndex,
                        orderNumber: orderNumber,
                        value: value,
                        cb: cb,
                        direction: direction,
                        fromOrder: fromOrder
                    });
                } else {
                    await splitInternal({
                        splitWeight: splitWeight,
                        origTicket: fullTicket,
                        origLedgerIndex: fullLedgerIndex,
                        orderNumber: orderNumber,
                        value: value,
                        cb: cb,
                        direction: direction,
                        fromOrder: fromOrder,
                        newDirection: order.direction,
                        dstOrder: order
                    })
                }


            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.

                ngivrGrowl(response.data.message);

                if (cb) {
                    return cb();
                }
                //return;
            });
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.

            ngivrGrowl(response.data.message);

            if (cb) {
                return cb();
            }
            //return;
        });
    };

    /**
     * Egy orderen kell tudni osztani a mérlegjegyet és azonos adatokkal létrehozni még egy ledger elemet
     *  ticket - ticket amiből leszedünk
     * ledgerIndex - régi ledger sorszáma amiből leszedünk
     * value - új ledger értéke amit le kell szedni a régiről
     * direction - irány
     * cb
     * @params options
     */
    let splitLedgerToSameDispoFunc = (options) => {
        const {ticket, ledgerIndex, value, cb, direction, splitWeight} = options;

        if (checkParam(ticket, ledgerIndex, value)) {
            return;
        }

        splitLedger({
            splitWeight: splitWeight,
            ticket: ticket,
            ledgerIndex: ledgerIndex,
            orderNumber: ticket.ledger[ledgerIndex].orderNumber,
            value: value,
            cb: cb,
            sameOrder: true,
            direction: direction
        });
    };

    /**
     * Egy birtokátruházón kell tudni osztani a mérlegjegyet és azonos adatokkal létrehozni még egy ledger elemet
     * @param ticket - ticket amiből leszedünk
     * @param ledgerIndex - régi ledger sorszáma amiből leszedünk
     * @param value - új ledger értéke amit le kell szedni a régiről
     * @param cb
     */
    let splitLedgerFunc = (ticket, ledgerIndex, value, cb) => {
        // birtokátruházónál nincs jelentősége, hogy fel- vagy lerakott súlyt osztunk
        if (ticket.ticketType !== 'possessionTransfer') {
            ngivrGrowl('Ticket type is not valid');
            return;
        }

        if (checkParam(ticket, ledgerIndex, value)) {
            return;
        }

        splitLedger({
            ticket: ticket,
            ledgerIndex: ledgerIndex,
            orderNumber: ticket.ledger[ledgerIndex].orderNumber,
            value: value,
            cb: cb
        });
    };

    /**
     * Megosztja a mérlegjegyet
     * options:
     * ticket: a teljes ticket objektum
     * ledgerIndex: az osztandó ledger elem indexe
     * orderNumber: az order sorszáma, amire pakolunk
     * value: a mennyiség az új ledgeren
     * cb
     * @param options
     */
    function splitLedger(options) {
        const {ticket, ledgerIndex, orderNumber, value, direction, cb, fromOrder, sameOrder, splitWeight} = options;
        // tudnunk kell, hogy a fel- vagy lerakott súllyal számoljunk
        //    ha direction in, akkor felrakott, ha out, akkor lerakott
        /*
        Megosztott súly kalkulációja

        Ha a felrakotthoz adjuk meg az új súly direction in
        Eredeti felrakott: origLoaded
        Eredeti le: origUnloaded
        Az átrakott mennyiség az új felrakott súly: value

        Az új lerakott mennyiség az új ledgerben: origUnloaded * value / origLoaded
        Az eredeti ledger új lerakott mennyisége: eredeti lerakott - új lerakott, vagyis origUnloaded - ( origUnloaded * value / origLoaded )


        Ha a lerakotthoz adjuk meg az új súly direction nem in
        Eredeti felrakott: origLoaded
        Eredeti le: origUnloaded
        Az átrakott mennyiség az új felrakott súly: value

        Az új felrakott mennyiség az új ledgerben: origLoaded * value / origUnloaded
        Az eredeti ledger új lerakott mennyisége: eredeti felrakott - új felrakott, vagyis origLoaded - ( origLoaded * value / origUnloaded )

        A járműveken is el kell végezni a módosítást
         */

        let origLoaded = ticket.ledger[ledgerIndex].loadedWeight;
        let origUnloaded = ticket.ledger[ledgerIndex].unloadedWeight;

        let request = {
            orderNumber: orderNumber,
            deleted: false,
        };

        $http.get('/api/orders/', {params: request}).then(async function (response) { //ismét lekérjük az új ordert, de átadhatnánk paraméterben is
            let order = response.data[0];
            let ledger = {}; //ebben lesz az új ledger elem
            let origLedgerDeleted = false;
            // csak akkor kell új ledger, ha a ticketben nincs olyan ledger, aminek az orderId-ja egyezik a cél order id-jával
            let oldLedgerIndex = null;
            if (!sameOrder) {
                oldLedgerIndex = Common.functiontofindIndexByKeyValue(ticket.ledger, 'orderId', order._id)
            }


            if (oldLedgerIndex !== null) {
                let origLedgerSubTicketName;
                let oldLedgerSubTicketName;
                let oldOrigLoaded = ticket.ledger[oldLedgerIndex].loadedWeight;
                let oldOrigUnloaded = ticket.ledger[oldLedgerIndex].unloadedWeight;
                // ticket.ledger[oldLedgerIndex].unloadedWeight += direction === 'in' ? origUnloaded * value / origLoaded : value;
                // ticket.ledger[oldLedgerIndex].loadedWeight += direction === 'in' ? value : origLoaded * value / origUnloaded;

                if (splitWeight === 'loadedWeight') {
                    ticket.ledger[oldLedgerIndex].loadedWeight += value;
                    ticket.ledger[oldLedgerIndex].unloadedWeight = ticket.ledger[oldLedgerIndex].loadedWeight / oldOrigLoaded * oldOrigUnloaded;

                    ticket.ledger[ledgerIndex].loadedWeight = ticket.ledger[ledgerIndex].loadedWeight - value;
                    ticket.ledger[ledgerIndex].unloadedWeight = ticket.ledger[ledgerIndex].loadedWeight / origLoaded * origUnloaded
                } else {
                    ticket.ledger[oldLedgerIndex].unloadedWeight += value;
                    ticket.ledger[oldLedgerIndex].loadedWeight += oldOrigLoaded * ticket.ledger[oldLedgerIndex].unloadedWeight / oldOrigUnloaded;

                    ticket.ledger[ledgerIndex].unloadedWeight = ticket.ledger[ledgerIndex].unloadedWeight - value;
                    ticket.ledger[ledgerIndex].loadedWeight = origLoaded * ticket.ledger[ledgerIndex].unloadedWeight / origUnloaded
                }

                ticket.ledger[oldLedgerIndex].unloadedWeight = parseFloat(ticket.ledger[oldLedgerIndex].unloadedWeight.toFixed(3));
                ticket.ledger[oldLedgerIndex].loadedWeight = parseFloat(ticket.ledger[oldLedgerIndex].loadedWeight.toFixed(3));
                ticket.ledger[ledgerIndex].loadedWeight = parseFloat(ticket.ledger[ledgerIndex].loadedWeight.toFixed(3));
                ticket.ledger[ledgerIndex].unloadedWeight = parseFloat(ticket.ledger[ledgerIndex].unloadedWeight.toFixed(3));

                if (ticket.ledger[ledgerIndex].loadedWeight === 0 && ticket.ledger[ledgerIndex].unloadedWeight === 0) { // ha nem marad az osztott ledgeren fel- és lerakott súly, akkor töröljük a ledger
                    origLedgerSubTicketName = ticket.ledger[ledgerIndex].subTicketName; //ezt lehet hogy törölni kell
                    oldLedgerSubTicketName = ticket.ledger[oldLedgerIndex].subTicketName;
                    if (oldLedgerIndex > ledgerIndex) oldLedgerIndex--;

                    ticket.ledger.splice(ledgerIndex, 1);

                    origLedgerDeleted = true
                }

                ticket.sygnus = order.sygnus;

                ticket.ownerId = order.sygnus ? ngivr.settings.ownFirm.id : order.partner[0]._id;
                ticket.ownerName = order.sygnus ? ngivr.settings.ownFirm.name : order.order.partner[0].name;

                $http.put('/api/tickets/' + ticket._id, ticket).then(async function (response) // updateljük a ticketet
                {
                    if (ticket.ticketType === 'ruralTour' && ticket.direction === 'in') {
                        let resp = await ngivrApi.query('orderVehicle', {search: {'inTicket': ticket.ledger[0].subTicketName}})
                        if (resp.data.docs.length) {
                            if (resp.data.docs[0].outTicket) {
                                let resp1 = await ngivrApi.query('ticket', {search: {'ledger.subTicketName': resp.data.docs[0].outTicket}})
                                await $http.put('/api/tickets/' + resp1.data.docs[0]._id, resp1.data.docs[0])
                            }
                        }
                    }
                    ngivrGrowl('Ledger has splitted and Ticket was saved');

                    //await createSplittedVehicle(response.data, ledgerIndex, ledger, fromOrder, origLedgerDeleted, origLedgerSubTicketName); //létrehozzuk az új járművet
                    //frissítjük a járművet, amihez a már meglévő ledger tartozik
                    updateVehicle({
                        origLedgerSubTicketName: origLedgerSubTicketName,
                        oldLedgerSubTicketName: oldLedgerSubTicketName,
                        ticket: response.data,
                        ledgerIndex: ledgerIndex,
                        oldLedgerIndex: oldLedgerIndex,
                        origLedgerDeleted: origLedgerDeleted
                    });
                    if (cb) {
                        return cb(ticket);
                    }
                }, function errorCallback(response) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.

                    ngivrGrowl(response.data.message);

                    if (cb) {
                        return cb();
                    }
                    //return;
                });
            } else {
                fillLedgerFromDispo(ledger, order, null, fromOrder, async function (response) {

                    let origLedgerSubTicketName;
                    ledger = response;
                    if (ticket.ticketType === 'ruralTour' && direction === 'out') {
                        let resp = await ngivrApi.query('cargoPlan', {search: {'sellContracts._id': fromOrder.ruralTourSellContractId}})
                        let cargoPlan = resp.data.docs[0];
                        let idx = Common.functiontofindIndexByKeyValue(cargoPlan.sellContracts, '_id', fromOrder.ruralTourSellContractId);

                        if (idx !== null) {
                            ledger.contractId = cargoPlan.sellContracts[idx].contractId
                        }
                        ledger.parityId = ticket.ledger[ledgerIndex].parityId;
                        ledger.parityName = ticket.ledger[ledgerIndex].parityName;

                        ledger.paritySettlementId = ticket.ledger[ledgerIndex].paritySettlementId;
                        ledger.paritySettlementName = ticket.ledger[ledgerIndex].paritySettlementName;

                        ledger.parityFobDestinationId = ticket.ledger[ledgerIndex].parityFobDestinationId;
                        ledger.parityFobDestinationName = ticket.ledger[ledgerIndex].parityFobDestinationName;
                        ledger.needContract = ticket.ledger[ledgerIndex].needContract
                    }
                    ledger.tcn = ticket.ledger[ledgerIndex].tcn;
                    ledger.plateNumber1 = ticket.ledger[ledgerIndex].plateNumber1;
                    ledger.plateNumber2 = ticket.ledger[ledgerIndex].plateNumber2;
                    ledger.country1 = ticket.ledger[ledgerIndex].country1;
                    ledger.country2 = ticket.ledger[ledgerIndex].country2;
                    ledger.arrivalDate = ticket.ledger[ledgerIndex].arrivalDate;
                    ledger.loadDate = ticket.ledger[ledgerIndex].loadDate;

                    // ledger.unloadedWeight = direction === 'in' ? origUnloaded * value / origLoaded : value;
                    // ledger.loadedWeight = direction === 'in' ? value : origLoaded * value / origUnloaded;
                    //ledger.remain = value;

                    // ha direction in, akkor a felrakottat osztjuk, egyébként a lerakottat
                    if (splitWeight === 'loadedWeight') {
                        ledger.loadedWeight = value;
                        ledger.unloadedWeight = ledger.loadedWeight / origLoaded * origUnloaded;

                        ticket.ledger[ledgerIndex].loadedWeight = ticket.ledger[ledgerIndex].loadedWeight - value;
                        ticket.ledger[ledgerIndex].unloadedWeight = ticket.ledger[ledgerIndex].loadedWeight / origLoaded * origUnloaded
                    } else {
                        ledger.unloadedWeight = value;
                        ledger.loadedWeight = origLoaded * ledger.unloadedWeight / origUnloaded;

                        ticket.ledger[ledgerIndex].unloadedWeight = ticket.ledger[ledgerIndex].unloadedWeight - value;
                        ticket.ledger[ledgerIndex].loadedWeight = origLoaded * ticket.ledger[ledgerIndex].unloadedWeight / origUnloaded
                    }

                    // ticket.ledger[ledgerIndex].loadedWeight = direction === 'in' ? ticket.ledger[ledgerIndex].loadedWeight - value :  ;
                    // ticket.ledger[ledgerIndex].unloadedWeight = direction === 'in' ? ticket.ledger[ledgerIndex].loadedWeight / origLoaded * origUnloaded  : ticket.ledger[ledgerIndex].unloadedWeight - value;
                    //ticket.ledger[ledgerIndex].remain = ticket.ledger[ledgerIndex].remain-value;

                    ledger.unloadedWeight = parseFloat(ledger.unloadedWeight.toFixed(3));
                    ledger.loadedWeight = parseFloat(ledger.loadedWeight.toFixed(3));
                    ticket.ledger[ledgerIndex].loadedWeight = parseFloat(ticket.ledger[ledgerIndex].loadedWeight.toFixed(3));
                    ticket.ledger[ledgerIndex].unloadedWeight = parseFloat(ticket.ledger[ledgerIndex].unloadedWeight.toFixed(3));

                    ledger.subTicketName = ticket.ticketName + '/' + (parseInt(ticket.ledger.length) + 1);

                    ticket.ledger.push(ledger); // az új ledger elemet betesszük a ticket.ledger tömbbe

                    if (ticket.ledger[ledgerIndex].loadedWeight === 0 && ticket.ledger[ledgerIndex].unloadedWeight === 0) { // ha nem marad az osztott ledgeren fel- és lerakott súly, akkor töröljük a ledger
                        origLedgerSubTicketName = ticket.ledger[ledgerIndex].subTicketName;
                        ledger.subTicketName = origLedgerSubTicketName;
                        ticket.ledger.splice(ledgerIndex, 1);
                        origLedgerDeleted = true
                    }

                    ticket.sygnus = order.sygnus;

                    ticket.ownerId = order.sygnus ? ngivr.settings.ownFirm.id : order.partner[0]._id;
                    ticket.ownerName = order.sygnus ? ngivr.settings.ownFirm.name : order.order.partner[0].name;


                    $http.put('/api/tickets/' + ticket._id, ticket).then(async function (response) // updateljük a ticketet
                    {
                        ngivrGrowl('Ledger has splitted and Ticket was saved');
                        if (ticket.ticketType === 'ruralTour' && ticket.direction === 'in') {
                            let resp = await ngivrApi.query('orderVehicle', {search: {'inTicket': ticket.ledger[0].subTicketName}})
                            if (resp.data.docs.length) {
                                if (resp.data.docs[0].outTicket) {
                                    let resp1 = await ngivrApi.query('ticket', {search: {'ledger.subTicketName': resp.data.docs[0].outTicket}})
                                    await $http.put('/api/tickets/' + resp1.data.docs[0]._id, resp1.data.docs[0])
                                }
                            }
                        }
                        if (!sameOrder)
                            await createSplittedVehicle(response.data, ledgerIndex, ledger, fromOrder, origLedgerDeleted, origLedgerSubTicketName); //létrehozzuk az új járművet

                        if (cb) {
                            return cb(ticket);
                        }
                    }, function errorCallback(response) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.

                        ngivrGrowl(response.data.message);

                        if (cb) {
                            return cb();
                        }
                        //return;
                    });
                });
            }


        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.

            ngivrGrowl(response.data.message);

            if (cb) {
                return cb();
            }
            //return;
        });
    }

    /**
     * Order alapján létrehozza az új ledger elemet
     * @param ledger
     * @param dispo
     * @param internalTransfer
     * @param fromOrder
     * @param cb
     */
    function fillLedgerFromDispo(ledger, dispo, internalTransfer, fromOrder, cb) {

        if (dispo.hasOwnProperty('partner') && dispo.partner.length === 1) {
            ledger.partnerName = dispo.partner[0].name;
            doIT();
        }
        else {
            if (dispo.hasOwnProperty('seller')) {
                ledger.partnerName = dispo.seller.name;
                doIT();
            }
            else {
                ngivrService.api.id('partner', ngivr.settings.ownFirm._id).then(function (response) {
                    const firm = response.data.doc;
                    ledger.partnerName = firm.name;
                    doIT();
                })
            }
        }

        function doIT() {

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

            ledger.orderId = dispo._id;
            ledger.orderNumber = dispo.orderNumber;
            ledger.actualServiceContractId = dispo.actualServiceContract;
            ledger.sourceServiceContractId = dispo.sourceServiceContractId;

            //ServicePrice tomb feltöltés. Ami null, az szerveren lesz kitöltve
            if (dispo.bagFilling != null) {
                ledger.servicePrice.push({
                    serviceType: ngivrStrings.serviceType.bagFilling, // Szolgáltatás típusa -> ngivrStrings.js
                    price: null, //ár
                    currency: null, //deviza
                    invoiceId: null //számla id
                })
            }
            if (dispo.depotLoading != null) {
                ledger.servicePrice.push({
                    serviceType: ngivrStrings.serviceType.depotLoading, // Szolgáltatás típusa -> ngivrStrings.js
                    price: null, //ár
                    currency: null, //deviza
                    invoiceId: null //számla id
                })
            }
            if (dispo.shipLoading != null) {
                ledger.servicePrice.push({
                    serviceType: ngivrStrings.serviceType.shipLoading, // Szolgáltatás típusa -> ngivrStrings.js
                    price: null, //ár
                    currency: null, //deviza
                    invoiceId: null //számla id
                })
            }
            if (dispo.shipUnloading != null) {
                ledger.servicePrice.push({
                    serviceType: ngivrStrings.serviceType.shipUnloading, // Szolgáltatás típusa -> ngivrStrings.js
                    price: null, //ár
                    currency: null, //deviza
                    invoiceId: null //számla id
                })
            }
            if (dispo.truckLoading != null) {
                ledger.servicePrice.push({
                    serviceType: ngivrStrings.serviceType.truckLoading, // Szolgáltatás típusa -> ngivrStrings.js
                    price: null, //ár
                    currency: null, //deviza
                    invoiceId: null //számla id
                })
            }

            ledger.parityId = dispo.parityId;
            ledger.parityName = dispo.parityName;

            ledger.paritySettlementId = dispo.paritySettlementId;
            ledger.paritySettlementName = dispo.paritySettlementName;

            ledger.parityFobDestinationId = dispo.parityFobDestinationId;
            ledger.parityFobDestinationName = dispo.parityFobDestinationName;

            ledger.needContract = dispo.needContract;

            return cb(ledger);
        }
    }

    function checkParam(ticket, ledgerIndex, value) {
        if (ledgerIndex === undefined) {
            ngivrGrowl('Ledger index is missing');
            return true;
        }

        if (value === undefined) {
            ngivrGrowl('Value is missing');
            return true;
        }

        if (ticket === undefined) {
            ngivrGrowl('Ticket is missing');
            return true;
        }

        if (ticket.ticketType === 'possessionTransfer') {
            ngivrGrowl('Ticket type is not valid');
            return true;
        }

        // if (ticket.ledger[ledgerIndex].remain - value < 0) {
        //     ngivrGrowl('Not enough in ledger remain');
        //     return true;
        // }

        // if (ticket.direction === 'in' || ticket.direction === 'external_in' || ticket.direction === 'internal_in') {
        //     if (ticket.ledger[ledgerIndex].loadedWeight - value < 0) {
        //         ngivrGrowl('Not enough in ledger loadedWeight');
        //         return true;
        //     }
        // }
        // else {
        //     if (ticket.ledger[ledgerIndex].unloadedWeight - value < 0) {
        //         ngivrGrowl('Not enough in ledger unloadedWeight');
        //         return true;
        //     }
        // }

        return false;
    }

    /**
     * Megosztott jármű létrehozása
     * @param ticket már updatelt
     * @param ledgerIndex az eredeti ledger indexe
     * @param ledger az új ledger elem
     * @param fromOrder
     * @param origLedgerDeleted
     * @param origLedgerSubTicketName
     * @returns {Promise<void>}
     */
    async function createSplittedVehicle(ticket, ledgerIndex, ledger, fromOrder, origLedgerDeleted, origLedgerSubTicketName) {

        if (!origLedgerDeleted) {

        }
        let subTicketName = origLedgerSubTicketName || ticket.ledger[ledgerIndex].subTicketName;

        let query = {
            subTicketName: subTicketName
        };


        $http.get('/api/orderVehicles/', {params: query}).then(function (response) {

            const vehicle = response.data[0];

            // az eredeti vehicle fel- és lerakott súlyait módosítjuk a meglévő ledger új súlyainak megfelelően

            if (vehicle && response.data.length === 1) {
                vehicle.unloadedWeight = ticket.ledger[ledgerIndex].unloadedWeight;
                vehicle.loadedWeight = ticket.ledger[ledgerIndex].loadedWeight;
                if (origLedgerDeleted) {
                    vehicle.deleted = true
                }
                $http.put('/api/orderVehicles/' + vehicle._id, vehicle).then(function (response) {
                });

                let newVehicle = angular.copy(vehicle);
                delete newVehicle._id;
                delete newVehicle.__v;
                delete newVehicle.createdAt;
                delete newVehicle.updatedAt;
                newVehicle.deleted = false;
                // delete newVehicle.tcn;
                // delete newVehicle.tcnStatus;
                newVehicle.unloadedWeight = ledger.unloadedWeight;
                newVehicle.loadedWeight = ledger.loadedWeight;
                newVehicle.orderId = ledger.orderId;

                if (ticket.ticketType !== 'ruralTour') {
                    if (vehicle.inTicket) {
                        newVehicle.inTicket = ledger.subTicketName;
                    }
                    if (vehicle.outTicket) {
                        newVehicle.outTicket = ledger.subTicketName;
                    }
                } else {
                    newVehicle.splitParentOrder = fromOrder._id;
                    if (ticket.direction === 'in') {
                        newVehicle.inTicket = ledger.subTicketName;
                        newVehicle.outTicket = vehicle.outTicket
                    } else {
                        newVehicle.inTicket = vehicle.inTicket;
                        newVehicle.outTicket = ledger.subTicketName;
                    }
                }


                $http.post('/api/orderVehicles/', newVehicle).then(function (response) {
                });
            }
        })

    }

    /**
     * Jűrmű update
     * abban az esetben hívjuk, ha nem kell új jráművet létrehozni,
     * hanem a meglévőn módosítjuk a mennyiségeket
     * ticket - a már módosított ticket
     * ledgerIndex - annak a ledgernek az indexe, amelyiket megosztjuk
     * oldLedgerIndex - annak a ledgernek az indexe, amit frissítettünk (amire visszapakoltunk)
     * fromOrder - a forrás order
     * ordigLedgerDeleted - törölt-e a megosztott ledger (ha a teljeset osztjuk meg, akkor lesz true)
     * origLedgerSubTicketName - a megosztott ledger subTicketName-e
     * @param options
     * @returns {Promise<void>}
     */
    async function updateVehicle(options) {
        const {ticket, ledgerIndex, ledger, fromOrder, origLedgerDeleted, origLedgerSubTicketName, oldLedgerIndex, oldLedgerSubTicketName} = options;
        // a felosztott járművet updateljük, ha kell töröljük
        let subTicketName = origLedgerSubTicketName;

        let query = {
            subTicketName: subTicketName
        };
        $http.get('/api/orderVehicles/', {params: query}).then(function (response) {
            const vehicle = response.data[0];
            if (origLedgerDeleted) {
                vehicle.deleted = true
            } else {
                vehicle.unloadedWeight = ticket.ledger[ledgerIndex].unloadedWeight;
                vehicle.loadedWeight = ticket.ledger[ledgerIndex].loadedWeight;
            }
            $http.put('/api/orderVehicles/' + vehicle._id, vehicle).then(function (response) {
            });
        });

        // azt updateljük, amire osztottunk
        if (oldLedgerIndex !== null) {
            query = {
                subTicketName: oldLedgerSubTicketName
            };

            $http.get('/api/orderVehicles/', {params: query}).then(function (response) {
                const vehicle = response.data[0];

                vehicle.unloadedWeight = ticket.ledger[oldLedgerIndex].unloadedWeight;
                vehicle.loadedWeight = ticket.ledger[oldLedgerIndex].loadedWeight;
                $http.put('/api/orderVehicles/' + vehicle._id, vehicle).then(function (response) {
                });

            })
        }

        // if (!origLedgerDeleted) {
        //
        // }
        // let subTicketName = origLedgerSubTicketName || ticket.ledger[ledgerIndex].subTicketName;
        //
        // let query = {
        //     subTicketName: subTicketName
        // };
        //
        //
        // $http.get('/api/orderVehicles/', {params: query}).then(function (response) {
        //
        //     const vehicle = response.data[0];
        //
        //     // az eredeti vehicle fel- és lerakott súlyait módosítjuk a meglévő ledger új súlyainak megfelelően
        //
        //     if (vehicle && response.data.length === 1) {
        //         vehicle.unloadedWeight = ticket.ledger[ledgerIndex].unloadedWeight;
        //         vehicle.loadedWeight = ticket.ledger[ledgerIndex].loadedWeight;
        //         if (origLedgerDeleted) {
        //             vehicle.deleted = true
        //         }
        //         $http.put('/api/orderVehicles/' + vehicle._id, vehicle).then(function (response) {
        //         });
        //
        //         let newVehicle = angular.copy(vehicle);
        //         delete newVehicle._id;
        //         delete newVehicle.__v;
        //         delete newVehicle.createdAt;
        //         delete newVehicle.updatedAt;
        //         newVehicle.deleted = false;
        //         // delete newVehicle.tcn;
        //         // delete newVehicle.tcnStatus;
        //         newVehicle.unloadedWeight = ledger.unloadedWeight;
        //         newVehicle.loadedWeight = ledger.loadedWeight;
        //         newVehicle.orderId = ledger.orderId;
        //
        //         if (ticket.ticketType !== 'ruralTour') {
        //             if (vehicle.inTicket) {
        //                 newVehicle.inTicket = ledger.subTicketName;
        //             }
        //             if (vehicle.outTicket) {
        //                 newVehicle.outTicket = ledger.subTicketName;
        //             }
        //         } else {
        //             newVehicle.splitParentOrder = fromOrder._id;
        //             if (ticket.direction === 'in') {
        //                 newVehicle.inTicket = ledger.subTicketName;
        //                 newVehicle.outTicket = vehicle.outTicket
        //             } else {
        //                 newVehicle.inTicket = vehicle.inTicket;
        //                 newVehicle.outTicket = ledger.subTicketName;
        //             }
        //         }
        //
        //
        //         $http.post('/api/orderVehicles/', newVehicle).then(function (response) {
        //         });
        //     }
        // })

    }

    /**
     * Belső áttárolás megosztása
     * splitWeight: "loadedWeight" vagy "unloadedWeight
     * origTicket: ereseti ticket
     * origLedgerIndex: eredeti ticket ledgerének indexe
     * fromOrder: eredei order objektum
     * value: a menyyiség
     * direction: eredeti ticket iránya
     * newDirection: új ticket iránya
     * orderNumber: célorder sorszáma
     * @param options
     * @returns {Promise<void>}
     */
    async function splitInternal(options) {
        try {
            let {splitWeight, origTicket, origLedgerIndex, fromOrder, value, direction, newDirection, orderNumber, dstOrder, cb} = options;
            /*
            Meg kell keresni az internal order mindkét ticketjét
            módosítani kell bennük a mennyiségeket
            updatelni kell a két ticketet

             */
            let origOutTicket = undefined;
            let vehicle = undefined;
            if (origTicket.direction === 'internal_in') {
                let resp = await ngivrApi.query('orderVehicle', {search: {inTicket: origTicket.ledger[origLedgerIndex].subTicketName}});
                vehicle = resp.data.docs[0];
                resp = await ngivrApi.query('ticket', {search: {'ledger.subTicketName': vehicle.outTicket}});
                origOutTicket = resp.data.docs[0];
                console.warn('in', origTicket);
                console.warn('out', origOutTicket)
            }
            let newVehicle = angular.copy(vehicle);
            delete newVehicle._id;
            delete newVehicle.__v;
            delete newVehicle.createdAt;
            delete newVehicle.updatedAt;
            delete newVehicle.inTicket;
            delete newVehicle.outTicket;
            delete newVehicle.loadDepot;

            let origLedgerDeleted = false;
            let origLoaded = origTicket.ledger[origLedgerIndex].loadedWeight;
            let origUnloaded = origTicket.ledger[origLedgerIndex].unloadedWeight;
            if (splitWeight === 'loadedWeight') {
                if (value !== origTicket.ledger[origLedgerIndex].loadedWeight) {
                    origTicket.ledger[origLedgerIndex].loadedWeight -= value;
                    origTicket.ledger[origLedgerIndex].unloadedWeight = parseFloat((origTicket.ledger[origLedgerIndex].loadedWeight / origLoaded * origUnloaded).toFixed(3))

                    newVehicle.loadedWeight = value;
                    newVehicle.unloadedWeight = origUnloaded - origTicket.ledger[origLedgerIndex].unloadedWeight
                } else {
                    if (origTicket.ledger.length > 1) {
                        origTicket.ledger.splice(origLedgerIndex, 1);
                        origOutTicket.ledger.splice(origLedgerIndex, 1)
                    } else {
                        origTicket.deleted = true;
                        origOutTicket.deleted = true
                    }
                    origLedgerDeleted = true
                }


            } else {
                if (value !== origTicket.ledger[origLedgerIndex].unloadedWeight) {
                    origTicket.ledger[origLedgerIndex].unloadedWeight -= value;
                    origTicket.ledger[origLedgerIndex].loadedWeight = parseFloat((origTicket.ledger[origLedgerIndex].unloadedWeight / origUnloaded * origLoaded).toFixed(3))

                    newVehicle.unloadedWeight = value;
                    newVehicle.loadedWeight = origLoaded - origTicket.ledger[origLedgerIndex].loadedWeight;
                } else {
                    if (origTicket.ledger.length > 1) {
                        origTicket.ledger.splice(origLedgerIndex, 1);
                        origOutTicket.ledger.splice(origLedgerIndex, 1)
                    } else {
                        origTicket.deleted = true;
                        origOutTicket.deleted = true
                    }
                    origLedgerDeleted = true
                }

            }
            let origOutLedgerIndex = Common.functiontofindIndexByKeyValue(origOutTicket.ledger, 'subTicketName', vehicle.outTicket);
            origOutTicket.ledger[origOutLedgerIndex].loadedWeight = origTicket.ledger[origLedgerIndex].loadedWeight;
            origOutTicket.ledger[origOutLedgerIndex].unloadedWeight = origTicket.ledger[origLedgerIndex].unloadedWeight;

            // if (origTicket.ledger[origLedgerIndex].loadedWeight === 0 && origTicket.ledger[origLedgerIndex].unloadedWeight === 0) {
            //     if (origTicket.ledger.length >1) {
            //         origTicket.ledger.splice(origLedgerIndex, 1);
            //         origOutTicket.ledger.splice(origLedgerIndex, 1)
            //     } else {
            //         origTicket.deleted = true;
            //         origOutTicket.deleted = true
            //     }
            //     origLedgerDeleted = true
            //
            // }
            await ngivrHttp.put('/api/tickets/' + origOutTicket._id, origOutTicket);
            await ngivrHttp.put('/api/tickets/' + origTicket._id, origTicket);

            await updateVehicle({
                origLedgerSubTicketName: origTicket.ledger[origLedgerIndex].subTicketName,
                oldLedgerSubTicketName: null,
                ticket: origTicket,
                ledgerIndex: origLedgerIndex,
                oldLedgerIndex: null,
                origLedgerDeleted: origLedgerDeleted
            });

            /*
            létre kell hozni egy új járművet és ticket
            be kell küldeni az új ticketet
            járműveket is updatelni kell
             */
            // let newVehicle = angular.copy(vehicle);
            // delete newVehicle._id;
            // delete newVehicle.__v;
            // delete newVehicle.createdAt;
            // delete newVehicle.updatedAt;
            // delete newVehicle.inTicket;
            // delete newVehicle.outTicket;
            // delete newVehicle.loadDepot;
            // if (splitWeight === 'loadedWeight') {
            //
            //     newVehicle.loadedWeight = value;
            //     newVehicle.unloadedWeight = origUnloaded - origTicket.ledger[origLedgerIndex].unloadedWeight
            //
            // } else {
            //     newVehicle.unloadedWeight = value;
            //     newVehicle.loadedWeight = origLoaded - origTicket.ledger[origLedgerIndex].loadedWeight;
            // }
            newVehicle.orderId = dstOrder._id;
            let resp = await ngivrApi.save('orderVehicle', newVehicle);
            newVehicle = resp.data.doc;

            resp = await ngivrApi.id('order', dstOrder._id);
            dstOrder = resp.data.doc;

            resp = await ngivrApi.id('contract', dstOrder.contractId);
            dstOrder.relatedContract = [resp.data.doc];

            ngivrTicket.sendNewTicketForVehicleAndDispo(dstOrder, newVehicle, newDirection, async function () {
                await ngivrApi.save('orderVehicle', newVehicle);
                if (cb) {
                    return cb()
                }
            })


        } catch (e) {
            ngivrException.handleError(e);
            ngivr.overlay.hide()
        }

    }

    ngivrLedgerSplitterFactory.splitLedgerToDifferentDispo = splitLedgerToDifferentDispoFunc;
    ngivrLedgerSplitterFactory.splitLedgerToSameDispo = splitLedgerToSameDispoFunc;
    ngivrLedgerSplitterFactory.splitLedger = splitLedgerFunc;

    return ngivrLedgerSplitterFactory;
});
