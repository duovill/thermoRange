'use strict';
ngivr.angular.factory('ngivrTicket', ($q, $filter, $http, ngivrService, ngivrHttp, ngivrGrowl, ngivrApi, Auth, Common) => {

    let ngivrTicketFactory = {};

    /**
     * Új ticket beküldése
     * @param dispo
     * @param vehicle
     * @param cb
     * @returns {Promise<*>}
     */
    async function sendNewTicketForVehicleAndDispo(dispo, vehicle, direction, cb) {
        let response = await ngivrApi.id('depot', vehicle.depot ? vehicle.depot.depotId : vehicle.depotFull._id);
        let depot = response.data.doc;
        vehicle.saved = true; // trigger lock icon

        if (dispo.direction === 'internal') {

        }
        else {
            if (!dispo.relatedContract[0].parity[0].transCostBuy && !dispo.relatedContract[0].buy) { //ha vételi szerződés és nincs fuvardíj a par. szerint

            }
        }

        let ticket = {
            bruttoWeight: 0, // Brutto suly
            comments: [''], //megjegyzések tömbje, +-al a felületen több megjegyzést is felvehet
            contractId: null, //kapcsolódó szerződés ID    a tickethez kapcsolódó szerződés ID-ja, orderből jön
            direction: direction || null, //kitárolás, betárolás	a ticket irányát mutatja, értéke 'in', vagy 'out', aszerint, hogy a raktárba, vagy raktárból megy az áru
            depot: {
                name: null,
                depotId: null
            }, //raktár (cél)
            ledger: [],
            //loadedWeight: 0, //felrakott súly
            loadLocation: [{}], //felrakóhely
            numberOfPackings: 0, //kiszerelés darabszám//
            ownerId: null, //tulajdonos ID  a ticketen levő áru tulajdonosa, kiszállításnál a szerződéses partner, Sygnus tulajdonú termék szállításánál nincs kitöltve, ilyenkor a sygnus Boolean mezőt állítjuk true-ra.
            ownerName: '', //tulajdonos neve
            orderId: null, //diszpo ID
            orderNumber: '', //diszpo száma
            productId: null, //áru id a termék id-ja, eddig csak a neve szerepelt a sémában, de Lázárral úgy beszéltük, legyen benne az ID is
            serviceContractId: null, //kapcsolódó szolgáltatási szerződés ID  ha van, a kapcsolódó szolgáltatási szerződés ID-ja
            shipName: null,  //hajónév (hajó nevéből és érkezés dátumából generáljuk, pl név160501)
            site: {
                name: null,
                siteId: null
            }, // Telephely
            sygnus: false, //Sygnus-e a tulajdonos  ahogy korábban írtam, true esetén Sygnus tulajdonú a termék, false estén partnerkészletről van szó
            tcn: '', //EKÁER-szám
            ticketType: 'scale', //mérleg, birtokátruházó : scale/possessionTransfer   a ticket típusát határozza meg, "scale": mérleg típusú ticket, "possessionTransfer": birtokátruházó típusú ticket
            ticketValue: 0, //ticket értéke (súly * egységár/szerződés szerint/) a ticket értéke
            //unloadedWeight: 0 //lerakott súly
        };

        let newTicket = JSON.parse(JSON.stringify(ticket));

        await setUpTicketFromDispo(newTicket, dispo);

        newTicket.byId = Auth.getCurrentUser()._id;
        newTicket.byName = Auth.getCurrentUser().name;
        newTicket.country1 = vehicle.country1;
        newTicket.country2 = vehicle.country2;
        newTicket.plateNumber1 = vehicle.plateNumber1;
        newTicket.plateNumber2 = vehicle.plateNumber2;

        newTicket.depot.name = depot.name;
        newTicket.depot.depotId = depot._id;

        newTicket.ledger[0].loadedWeight = vehicle.loadedWeight;
        newTicket.ledger[0].unloadedWeight = vehicle.unloadedWeight;


        //rakott és lerakott súlyt is a ledger tömbben tároljuk, azért küön nem kell számlázandó súlyt menteni
        newTicket.loadDate = vehicle.loadDate;
        newTicket.arrivalDate = vehicle.arrivalDate;

        if (dispo.direction === 'internal') {
            newTicket.productName = dispo.orderProduct[0].name;
            newTicket.productId = dispo.orderProduct[0]._id;
            // newTicket.ownerId = dispo.partner[0]._id;
            // newTicket.ownerName = dispo.partner[0].name;
            //fulfillmentDate meghatározása
            newTicket.fulfillmentDate = vehicle.arrivalDate;

        }
        else {
            newTicket.productName = dispo.relatedContract[0].product[0].name;
            newTicket.productId = dispo.relatedContract[0].product[0]._id;
            // newTicket.ownerId = dispo.relatedContract[0].partner[0]._id;
            // newTicket.ownerName = dispo.relatedContract[0].partner[0].name;
            let response = await $http.get('/api/contracts/' + dispo.contractId);
            const contract = response.data;
            if (contract.buy) { //vételi szerződésnél teljesítés idejének meghatározása
                if (contract.parity[0].transCostBuy) {
                    newTicket.fulfillmentDate = vehicle.loadDate;
                } else {
                    newTicket.fulfillmentDate = vehicle.arrivalDate;
                }
            } else {  //eladási szerződésnél teljesítés idejének meghatározása, mivel csak fuvarköltséges paritásnál készül ticket, ezért mindig a lerakás ideje a teljesítés ideje is
                newTicket.fulfillmentDate = vehicle.arrivalDate;
            }
        }
        await setUpTicketDataForMainDispo(dispo, newTicket);
        await setTicketName(newTicket);

        let ticketResponse = await ngivrHttp.post('/api/tickets', newTicket);

        switch (ticketResponse.data.direction) {
            case "in":
                vehicle.inTicket = ticketResponse.data.ledger[0].subTicketName;
                break;

            case "out":
                vehicle.outTicket = ticketResponse.data.ledger[0].subTicketName;
                break;

            case "external_in":
                vehicle.inTicket = ticketResponse.data.ledger[0].subTicketName;
                break;

            case "external_out":
                vehicle.outTicket = ticketResponse.data.ledger[0].subTicketName;
                break;

            case 'internal_in':
                vehicle.inTicket = ticketResponse.data.ledger[0].subTicketName;
                break;

            case 'internal_out':
                vehicle.outTicket = ticketResponse.data.ledger[0].subTicketName;
                break;
        }
        return cb();

    }

    /**
     * A fő diszpó alapján kitölti a ticketet adatokkal
     * @method setUpTicketDataForMainDispo
     */
    async function setUpTicketDataForMainDispo(dispo, ticket) {
        const query = await ngivrService.data.query({schema: 'weighingHouse'}).query();
        let weighingHouse = query.data.docs[0];
        let nomination = {};

        if (dispo.cargoPlanId) {
            nomination = await $http.get('api/cargoplans/' + dispo.cargoPlanId);
        }

        if (dispo === null || dispo === undefined) {
            alert("ERROR: mainDispo is null");
        } else {
            console.log("setUpTicketDataForMainDispo: Main Dispo for ticket is: ");
            console.log(dispo);
            await setTransportType(ticket, dispo);
            ticket.loadLocation = dispo.loadLocation;
            ticket.loadLocationSettlement = dispo.loadLocationSettlement;
            if (!ticket.productName) {
                ticket.productName = (typeof dispo.orderProduct[0] === 'undefined') ? (null) : (dispo.orderProduct[0].name);
            }
            if (!ticket.productId) {
                ticket.productId = (typeof dispo.orderProduct[0] === 'undefined') ? (null) : (dispo.orderProduct[0]._id);
            }

            ticket.sygnus = dispo.sygnus;

            if (dispo.direction === 'internal') {
                if (!ticket.direction) {
                    if (dispo.loadLocation[0]._id === weighingHouse.site._id) {
                        ticket.direction = 'internal_out'
                    } else if (dispo.unloadLocation[0]._id === weighingHouse.site._id) {
                        ticket.direction = 'internal_in'
                    }
                }

            } else {
                ticket.direction = dispo.direction;
            }

            switch (dispo.direction) {
                case 'in':
                    // ticket.depot.name = dispo.unloadDepot[0].name;
                    // ticket.depot.depotId = dispo.unloadDepot[0]._id;
                    ticket.site.name = dispo.unloadLocation[0].name;
                    ticket.site.siteId = dispo.unloadLocation[0]._id;
                    break;

                case 'out':
                    let depotPromise = await ngivrApi.id('depot', dispo.loadDepot[0].depot);
                    let depot = depotPromise.data.doc;
                    // ticket.depot.name = depot.name;
                    // ticket.depot.depotId = depot._id;
                    ticket.site.name = depot.site[0].name;
                    ticket.site.siteId = depot.site[0]._id;
                    break;

                case 'external_in':
                    if (dispo.unloadLocation[0] !== undefined) {
                        ticket.site.name = dispo.unloadLocation[0].name;
                        ticket.site.siteId = dispo.unloadLocation[0]._id
                    } else if (dispo.unloadLocation[0] === undefined) {
                        ticket.site.name = nomination.loadPlace[0].name;
                        ticket.site.siteId = nomination.loadPlace[0]._id
                    }
                    break;

                case 'external_out':
                    if (dispo.loadLocation[0] !== undefined) {
                        ticket.site.name = dispo.loadLocation[0].name;
                        ticket.site.siteId = dispo.loadLocation[0]._id;
                    }
                    break;

                case 'internal':
                    if (dispo.loadLocation[0] !== undefined && dispo.loadLocation[0]._id === weighingHouse.site._id) { //TODO Ide még kell a felrakó raktár is
                        let depotPromise = await ngivrApi.id('depot', dispo.loadDepot[0].depot);
                        let depot = depotPromise.data.doc;
                        ticket.depot.name = depot.name;
                        ticket.depot.depotId = depot._id;
                        ticket.site.name = depot.site[0].name;
                        ticket.site.siteId = depot.site[0]._id;

                    } else if (dispo.unloadLocation[0] !== undefined && dispo.unloadLocation[0]._id === weighingHouse.site._id) {
                        ticket.site.name = dispo.unloadLocation[0].name;
                        ticket.site.siteId = dispo.unloadLocation[0]._id;
                        ticket.depot.name = dispo.unloadDepot[0].name;
                        ticket.depot.depotId = dispo.unloadDepot[0]._id;
                    } else if (ticket.direction === 'internal_out') {
                        let depotPromise = await ngivrApi.id('depot', dispo.loadDepot[0].depot);
                        let depot = depotPromise.data.doc;
                        ticket.depot.name = depot.name;
                        ticket.depot.depotId = depot._id;
                        ticket.site.name = depot.site[0].name;
                        ticket.site.siteId = depot.site[0]._id;
                    } else if (ticket.direction === 'internal_in') {
                        ticket.site.name = dispo.unloadLocation[0].name;
                        ticket.site.siteId = dispo.unloadLocation[0]._id;
                        ticket.depot.name = dispo.unloadDepot[0].name;
                        ticket.depot.depotId = dispo.unloadDepot[0]._id;
                    }
                    break;
            }

            if (ticket.depot && ticket.depot.depotId) {
                let response = await ngivrApi.id('depot', ticket.depot.depotId);
                ticket.depotFull = response.data.doc;
            }

            ticket.contractId = dispo.contractId;
            ticket.sustainability = dispo.sustainability;

            ticket.putInBags = dispo.putInBags;
            ticket.vehicles = dispo.vehicles;


            // if (dispo.hasOwnProperty('seller')) {
            //   ticket.ownerId = dispo.seller._id;
            //   ticket.ownerName = dispo.seller.name;
            // }
            // else {
            //   if (dispo.hasOwnProperty('partner') && dispo.partner.length === 1) {
            //     ticket.ownerId = dispo.partner[0]._id;
            //     ticket.ownerName = dispo.partner[0].name;
            //   }
            //   else {
            //     ngivrService.api.id('partner', ngivr.settings.ownFirm._id).then(function (response) {
            //       const firm = response.data.doc;
            //       ticket.ownerId = firm._id;
            //       ticket.ownerName = firm.name;
            //     })
            //   }
            // }

            if (ticket.productId === null && dispo.bfkd) {
                ngivrService.api.id('cargoPlan', dispo.cargoPlanId).then(function (response) {
                    const cargo = response.data.doc;
                    ticket.productId = cargo.sellContracts[0].productId;
                    ticket.productName = cargo.sellContracts[0].productName;
                })
            }

            //Ha az orderben nincsenek meg bizonyos adatok, akkor a hozza tartozo contract alapjan töltjük ki
            if (dispo.contractId !== null && dispo.contractId !== undefined) {
                $http.get('api/contracts/' + dispo.contractId).then(function (contract) {
                    contract = contract.data;
                    if (dispo.sustainability === '') {
                        ticket.sustainability = contract.sustainability;
                    }
                }).catch(function (error) {
                    console.error(error);
                    ngivr.growl('Szerződések betöltése nem sikerült', 'error');
                });
            }
        }
    }

    /**
     * Sorszámot ad a ticketnek, és a ledger-eknek
     * @param ticket
     * @returns {Promise.<void>}
     */
    async function setTicketName(ticket) {
        let weighingHouse;
        if (ticket.weighingHouse) {
            const query = await ngivrService.data.query({schema: 'weighingHouse'}).query();
            weighingHouse = query.data.docs[0];
        }

        let ticketName;
        let prefix = weighingHouse ? weighingHouse.prefix + '-' : '';
        switch (ticket.direction) {
            case "in":
                if (ticket.sygnus) {
                    ticketName = await ngivrTicketFactory.setNumber(`BTS${ngivr.settings.plusPrefix}`);
                    ticket.ticketName = prefix + ticketName
                } else {
                    ticketName = await ngivrTicketFactory.setNumber(`BTP${ngivr.settings.plusPrefix}`);
                    ticket.ticketName = prefix + ticketName
                }
                break;

            case "out":
                if (ticket.sygnus) {
                    ticketName = await ngivrTicketFactory.setNumber(`KTS${ngivr.settings.plusPrefix}`);
                    ticket.ticketName = prefix + ticketName
                } else {
                    ticketName = await ngivrTicketFactory.setNumber(`KTB${ngivr.settings.plusPrefix}`);
                    ticket.ticketName = prefix + ticketName
                }
                break;

            case "external_in":
                ticketName = await ngivrTicketFactory.setNumber(`PKB${ngivr.settings.plusPrefix}`);
                ticket.ticketName = prefix + ticketName;
                break;

            case "external_out":
                ticketName = await ngivrTicketFactory.setNumber(`PKH${ngivr.settings.plusPrefix}`);
                ticket.ticketName = prefix + ticketName;
                break;

            case 'internal_in':
                if (ticket.sygnus) {
                    ticketName = await ngivrTicketFactory.setNumber(`BAS2${ngivr.settings.plusPrefix}`);
                    ticket.ticketName = prefix + ticketName;
                } else {
                    ticketName = await ngivrTicketFactory.setNumber(`BAP2${ngivr.settings.plusPrefix}`);
                    ticket.ticketName = prefix + ticketName
                }
                break;

            case 'internal_out':
                if (ticket.sygnus) {
                    ticketName = await ngivrTicketFactory.setNumber(`BAS1${ngivr.settings.plusPrefix}`);
                    ticket.ticketName = prefix + ticketName
                } else {
                    ticketName = await ngivrTicketFactory.setNumber(`BAP1${ngivr.settings.plusPrefix}`);
                    ticket.ticketName = prefix + ticketName
                }
                break;
        }

        for (let i  in ticket.ledger) {
            ticket.ledger[i].subTicketName = ticket.ticketName + '/' + (parseInt(i) + 1);
        }
    }

    /**
     * Előkészített ticket feltöltése a dispo adataival
     * @param ticket
     * @param dispo
     */
    async function setUpTicketFromDispo(ticket, dispo) {
        ticket.loadLocation = dispo.loadLocation;
        ticket.productName = (typeof dispo.orderProduct === 'undefined') ? (null) : (dispo.orderProduct.name);
        ticket.productId = (typeof dispo.orderProduct === 'undefined') ? (null) : (dispo.orderProduct._id);
        ticket.orderId = dispo._id;
        ticket.orderNumber = dispo.orderNumber;
        //ticket.direction = dispo.direction;

        ticket.sygnus = dispo.sygnus;
        ticket.contractId = dispo.contractId;
        if (!ticket.sygnus) {
            ticket.ownerId = !dispo.hasOwnProperty('partner') ? null : ((typeof dispo.partner[0] === 'undefined') ? (null) : (dispo.partner[0]._id));
            ticket.ownerName = !dispo.hasOwnProperty('partner') ? null : ((typeof dispo.partner[0] === 'undefined') ? (null) : (dispo.partner[0].name));
        } else {
            let response = await ngivrService.api.id('partner', ngivr.settings.ownFirm._id);
            const firm = response.data.doc;
            ticket.ownerId = firm._id;
            ticket.ownerName = firm.name;

        }

        ticket.unloadLocation = dispo.unloadLocation;
        ticket.ledger.push({
            contractId: dispo.contractId,
            orderId: dispo._id,
            orderNumber: dispo.orderNumber
        });
    }

    /**
     * Szállítás típisát határozza meg
     * @param ticket
     * @param dispo
     * @returns {Promise<void>}
     */
    async function setTransportType(ticket, dispo) {
        const query = await ngivrService.data.query({schema: 'weighingHouse'}).query();
        let weighingHouse = query.data.docs[0];

        if (dispo) {
            if (dispo.sygnus) {
                if (dispo.direction === 'out') {
                    if (dispo.cargoPlanId) {
                        ticket.transportType = 'Sygnus hajórakodás'
                    } else {
                        ticket.transportType = 'Sygnus kitárolás'
                    }
                } else if (dispo.direction === 'in') {
                    if (dispo.cargoPlanId) {
                        ticket.transportType = 'Sygnus hajórakodás vételi szerződésből'
                    } else {
                        ticket.transportType = 'Sygnus betárolás'
                    }
                } else if (dispo.direction === 'internal') {
                    let loadType;
                    if (dispo.loadLocation[0]._id === weighingHouse.site._id) {
                        loadType = 'felrakodás'
                    } else if (dispo.unloadLocation[0]._id === weighingHouse.site._id) {
                        loadType = 'lerakodás'
                    }
                    if (dispo.cargoPlanId) {
                        ticket.transportType = 'Sygnus hajórakodás belső áttárolásból'
                    } else {
                        ticket.transportType = 'Sygnus belső áttárolás, ' + loadType
                    }
                }

            } else {
                if (dispo.direction === 'out') {
                    if (dispo.cargoPlanId) {
                        ticket.transportType = 'Partner hajórakodás tárházból'
                    } else {
                        ticket.transportType = 'Partner kitárolás'
                    }
                } else if (dispo.direction === 'in') {
                    ticket.transportType = 'Partner betárolás'

                } else if (dispo.direction === 'external_in') {
                    ticket.transportType = 'Partner külső hajórakodás'

                } else if (dispo.direction === 'internal') {
                    let loadType;
                    if (dispo.loadLocation[0]._id === weighingHouse.site._id) {
                        loadType = 'felrakodás'
                    } else if (dispo.unloadLocation[0]._id === weighingHouse.site._id) {
                        loadType = 'lerakodás'
                    }
                    if (dispo.cargoPlanId) {
                        ticket.transportType = 'Partner hajórakodás belső áttárolásból'
                    } else {
                        ticket.transportType = 'Partner belső áttárolás, ' + loadType
                    }
                }

            }
        } else
            ticket.transportType = '-'
    }

    /**
     * Vidéki túra kimenő ticket beküldése
     * @param dispo
     * @param vehicle
     * @param cb
     * @returns {Promise<void>}
     */
    async function sendRuralTourOutTicket(dispo, vehicle, cb) //ticket küldése
    {
        console.log('send ticket');

        const cargoPlanResp = await ngivrApi.id('cargoPlan', dispo.cargoPlanId);
        const cargoPlan = cargoPlanResp.data.doc;

        let sellContractId = cargoPlan.sellContracts.filter((o) => {
            return o._id === dispo.ruralTourSellContractId
        })[0].contractId;

        const sellContractResp = await ngivrApi.id('contract', sellContractId);
        const sellContract = sellContractResp.data.doc;
        const ticket = {};

        ticket.byId = Auth.getCurrentUser()._id;
        ticket.byName = Auth.getCurrentUser().name;
        ticket.country1 = vehicle.country1;
        ticket.country2 = vehicle.country2;
        ticket.fulfillmentDate = sellContract.parity[0].transCostSell === true ? vehicle.arrivalDate : vehicle.loadDate;
        ticket.loadLocation = dispo.loadLocation[0];
        ticket.unloadLocation = vehicle.unloadLocation;
        ticket.plateNumber1 = vehicle.plateNumber1;
        ticket.plateNumber2 = vehicle.plateNumber2;
        ticket.productId = dispo.relatedContract[0].product[0]._id;
        ticket.productName = dispo.relatedContract[0].product[0].name;
        ticket.ownerId = sellContract.partner[0]._id;
        ticket.ownerName = sellContract.partner[0].name;
        ticket.internalTransfer = false;
        ticket.ledger = [];

        //let response = await ngivrApi.id('cargoPlan', dispo.cargoPlanId);
        //const idx = Common.functiontofindIndexByKeyValue(response.data.doc.sellContracts, '_id', dispo.sellContractId);
        //let contractId = response.data.doc.sellContracts[idx].contractId;
        let ledger = {
            orderId: dispo._id,
            orderNumber: dispo.orderNumber,
            contractId: sellContractId,
            loadedWeight: vehicle.loadedWeight,
            unloadedWeight: vehicle.unloadedWeight,

            parityId: sellContract.parity[0]._id,
            parityName: sellContract.parity[0].name,
            paritySettlementId: sellContract.parity[0].river ? undefined : sellContract.parityPlaces[0]._id,
            paritySettlementName: sellContract.parity[0].river ? undefined : sellContract.parityPlaces[0].name,

            parityFobDestinationName: sellContract.parity[0].river ? sellContract.fobDestination : undefined,
        };
        if (sellContract.parity[0].river) {
            let resp = await ngivrApi.query('fobDestination', {search: {name: ledger.parityFobDestinationName}})
            ledger.parityFobDestinationId = resp.data.docs[0]._id
        }

        ticket.ledger.push(ledger);

        ticket.direction = 'out';
        ticket.ticketType = 'ruralTour';
        ticket.sygnus = true;
        ticket.arrivalDate = vehicle.arrivalDate;
        ticket.loadDate = vehicle.loadDate;
        ticket.unloadLocation = dispo.unloadLocation[0];

        if (vehicle.tcn && ticket.sygnus) {
            ticket.ledger[0].tcn = vehicle.tcn;
            ticket.ledger[0].plateNumber1 = vehicle.plateNumber1;
            ticket.ledger[0].plateNumber2 = vehicle.plateNumber2;
            ticket.ledger[0].country1 = vehicle.country1;
            ticket.ledger[0].country2 = vehicle.country2;
        }

        await setTicketName(ticket);

        let query = {
            deleted: false,
            subTicketName: vehicle.inTicket
        };
        $http.get('/api/tickets', {params: query}).then(function (tickets) {
            ticket.ledger[0].relationId = tickets.data[0].ledger[0].relationId;
            ticket.ledger[0].relatedTicketId = tickets.data[0]._id;
            let inTicket = tickets.data[0];

            $http.post('api/tickets', ticket).then(async function (ticketResponse) {

                //Lerakott súly megadása: lerakott súly megadása után bemegy az out ticket, telejésít az eladási szerződésére. Az in ticket lerakott súlyát updete-elni kell,
                inTicket.ledger[0].unloadedWeight = ticket.ledger[0].unloadedWeight;
                inTicket.ledger[0].loadedWeight = ticket.ledger[0].loadedWeight;
                await $http.put('api/tickets/' + inTicket._id, inTicket);

                switch (ticketResponse.data.direction) {
                    case "in":
                        vehicle.inTicket = ticketResponse.data.ledger[0].subTicketName;
                        break;

                    case "out":
                        vehicle.outTicket = ticketResponse.data.ledger[0].subTicketName;
                        break;

                    case "external_in":
                        vehicle.inTicket = ticketResponse.data.ledger[0].subTicketName;
                        break;

                    case "external_out":
                        vehicle.outTicket = ticketResponse.data.ledger[0].subTicketName;
                        break;

                    case 'internal_in':
                        vehicle.inTicket = ticketResponse.data.ledger[0].subTicketName;
                        break;

                    case 'internal_out':
                        vehicle.outTicket = ticketResponse.data.ledger[0].subTicketName;
                        break;
                }

                return cb();
            })
        });

    }

    /**
     * Vidéki túra bejövő ticket beküldése
     * @param dispo
     * @param vehicle
     * @param cb
     * @returns {Promise<void>}
     */
    async function sendRuralTourInTicket(dispo, vehicle, cb) //ticket küldése
    {
        $http.get('/api/counters/ticketRelation').then(async function (o) {

            let response = await ngivrApi.id('contract', dispo.contractId);

            let buyContract = response.data.doc;

            const number = Common.formatNumberLength(o.data.counter, 6);

            const ticket = {};

            ticket.byId = Auth.getCurrentUser()._id;
            ticket.byName = Auth.getCurrentUser().name;
            ticket.country1 = vehicle.country1;
            ticket.country2 = vehicle.country2;
            ticket.fulfillmentDate = buyContract.parity[0].transCostBuy === true ? vehicle.loadDate : vehicle.arrivalDate; //TODO ez nem mindig igaz, paritástól függ!!
            ticket.loadLocation = dispo.loadLocation[0];
            ticket.unloadLocation = vehicle.unloadLocation;
            ticket.plateNumber1 = vehicle.plateNumber1;
            ticket.plateNumber2 = vehicle.plateNumber2;
            ticket.productId = dispo.relatedContract[0].product[0]._id;
            ticket.productName = dispo.relatedContract[0].product[0].name;
            ticket.ownerId = dispo.relatedContract[0].partner[0]._id;
            ticket.ownerName = dispo.relatedContract[0].partner[0].name;

            ticket.ledger = [];

            ticket.ledger.push({
                orderId: dispo._id,
                orderNumber: dispo.orderNumber,
                contractId: dispo.contractId,
                relationId: number,
                loadedWeight: vehicle.loadedWeight,
                unloadedWeight: vehicle.unloadedWeight,

                parityId: dispo.parityId,
                parityName: dispo.parityName,
                paritySettlementId: dispo.paritySettlementId,
                paritySettlementName: dispo.paritySettlementName,
                parityFobDestinationId: dispo.parityFobDestinationId,
                parityFobDestinationName: dispo.parityFobDestinationName,
            });

            ticket.direction = 'in';
            ticket.ticketType = 'ruralTour';
            ticket.sygnus = true;
            ticket.arrivalDate = vehicle.arrivalDate;
            ticket.loadDate = vehicle.loadDate;

            if (vehicle.tcn && ticket.sygnus) {
                ticket.ledger[0].tcn = vehicle.tcn;
                ticket.ledger[0].plateNumber1 = vehicle.plateNumber1;
                ticket.ledger[0].plateNumber2 = vehicle.plateNumber2;
                ticket.ledger[0].country1 = vehicle.country1;
                ticket.ledger[0].country2 = vehicle.country2;
            }

            await setTicketName(ticket);

            $http.post('api/tickets', ticket).then(function (ticketResponse) {

                switch (ticketResponse.data.direction) {
                    case "in":
                        vehicle.inTicket = ticketResponse.data.ledger[0].subTicketName;
                        break;

                    case "out":
                        vehicle.outTicket = ticketResponse.data.ledger[0].subTicketName;
                        break;

                    case "external_in":
                        vehicle.inTicket = ticketResponse.data.ledger[0].subTicketName;
                        break;

                    case "external_out":
                        vehicle.outTicket = ticketResponse.data.ledger[0].subTicketName;
                        break;

                    case 'internal_in':
                        vehicle.inTicket = ticketResponse.data.ledger[0].subTicketName;
                        break;

                    case 'internal_out':
                        vehicle.outTicket = ticketResponse.data.ledger[0].subTicketName;
                        break;
                }
                return cb();
            })
        })
    }

    async function sendUnloadedTicketUpdate(ticket, vehicle, ledgerIndex) //ticket update
    {
        delete ticket.__v;
        ticket.ledger[ledgerIndex].unloadedWeight = vehicle.unloadedWeight;
        ticket.ledger[ledgerIndex].arrivalDate = vehicle.arrivalDate;
        ticket.arrivalDate = vehicle.arrivalDate;

        await $http.put('api/tickets/' + ticket._id, ticket);
    }

    async function updateTicketLedgerWeightByVehicleWeight(ticket, vehicle, ledgerIndex) //ticket update
    {
        delete ticket.__v;
        ticket.ledger[ledgerIndex].unloadedWeight = vehicle.unloadedWeight;
        ticket.ledger[ledgerIndex].loadedWeight = vehicle.loadedWeight;

        await $http.put('api/tickets/' + ticket._id, ticket);
    }

    /**
     * Sorszám kiosztása
     */
    async function setNumber(type) {
        let year = new Date().getFullYear().toString().slice(-2); //évszám a sorszámban
        if (year > 17) {
            let response = await $http.get('/api/counters/' + type + '_' + year);
            return type + year + '/' + Common.formatNumberLength(response.data.counter, 5);
        } else {
            let response;
            if (type === 'SBD') {
                response = await $http.get('/api/counters/ownDispoIn');
            } else if (type === 'SKD') {
                response = await $http.get('/api/counters/ownDispoOut');
            } else {
                response = await $http.get('/api/counters/' + type);
            }

            return type + year + '/' + Common.formatNumberLength(response.data.counter, 5);
        }


    }

    ngivrTicketFactory.sendNewTicketForVehicleAndDispo = sendNewTicketForVehicleAndDispo;
    ngivrTicketFactory.sendRuralTourInTicket = sendRuralTourInTicket;
    ngivrTicketFactory.sendRuralTourOutTicket = sendRuralTourOutTicket;
    ngivrTicketFactory.sendUnloadedTicketUpdate = sendUnloadedTicketUpdate;
    ngivrTicketFactory.updateTicketLedgerWeightByVehicleWeight = updateTicketLedgerWeightByVehicleWeight;
    ngivrTicketFactory.setNumber = setNumber;

    return ngivrTicketFactory;
});
