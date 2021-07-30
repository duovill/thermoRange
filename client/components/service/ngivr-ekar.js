'use strict';
ngivr.angular.factory('ngivrEkaer', (ngivrHttp, ngivrService) => {

    return {

        /**
         * EKÁER igénylése
         * @param items
         * @param content
         * @param cb
         */
        createTcn: (items, content, cb) => { //ekáer szám kérése, létrehozása
            function isBlank(str) {
                return (!str || /^\s*$/.test(str));
            }


            for (let i in items) {
                if (items[i].hasOwnProperty('tcn')) {
                    return
                }
            }
            let tradeCards = [];
            let ekaerErrors = [];
            for (let i in items) {
                let productName = '';

                if (content.direction === 'internal') {
                    if (content.orderProduct[0].itemType === 'Sygnus termények') {
                        productName = content.orderProduct[0].productGroupName;
                    } else {
                        productName = content.orderProduct[0].name;
                    }
                }
                else {
                    if (content.relatedContract[0].product[0].itemType === 'Sygnus termények') {
                        productName = content.relatedContract[0].product[0].productGroupName;
                    } else {
                        productName = content.relatedContract[0].product[0].name;
                    }
                }

                let tradeCardOrderNumber = '';
                let productVtsz = '';
                if (content.direction === 'internal') {
                    tradeCardOrderNumber = content.orderNumber;
                    productVtsz = content.orderProduct[0].vtsz;
                }
                else {
                    tradeCardOrderNumber = content.relatedContract[0].contractNumber;
                    productVtsz = content.relatedContract[0].product[0].vtsz;
                }

                let tradeCard = (
                    {
                        orderNumber: tradeCardOrderNumber,
                        tradeType: content.tradeType,
                        isSellerDelivery: content.ekaerDestinationVat !== ngivr.settings.ownFirm.vatNumberHU,
                        modByCarrierEnabled: content.modByCarrierEnabled,
                        isIntermodal: content.isIntermodal,
                        sellerName: content.seller.name,
                        sellerVatNumber: content.seller.address.country.code === 'HU' ? content.ekaerSellerVat.slice(0, 8) : content.ekaerSellerVat,
                        sellerCountry: content.seller.address.country.code,
                        sellerAddress: content.seller.address.city + ' ' + content.seller.address.address,
                        destinationName: content.destination.name,
                        destinationVatNumber: content.destination.address.country.code === 'HU' ? content.ekaerDestinationVat.slice(0, 8) : content.ekaerDestinationVat,
                        destinationCountry: content.destination.address.country.code,
                        destinationAddress: content.destination.address.city + ' ' + content.destination.address.address,
                        unloadReporter: "",
                        tradeCardType: "N",
                        deliveryPlans: {
                            deliveryPlan: {
                                isDestinationCompanyIdentical: "false",  //TODO átgondolni!
                                loadLocation: {
                                    country: content.loadLocation[0].country.code,
                                    zipCode: content.loadLocation[0].zipCode ? content.loadLocation[0].zipCode.zipCode : undefined,
                                    city: content.loadLocation[0].city,
                                    street: content.loadLocation[0].street,
                                    streetType: content.loadLocation[0].streetType,
                                    streetNumber: content.loadLocation[0].streetNumber,
                                    lotNumber: content.loadLocation[0].lotNumber === '' ? undefined : content.loadLocation[0].lotNumber
                                },
                                saveLoadLocation: "false",
                                unloadLocation: {
                                    country: content.unloadLocation[0].country.code,
                                    zipCode: content.unloadLocation[0].zipCode ? content.unloadLocation[0].zipCode.zipCode : undefined,
                                    city: content.unloadLocation[0].city,
                                    street: content.unloadLocation[0].street,
                                    streetType: content.unloadLocation[0].streetType,
                                    streetNumber: content.unloadLocation[0].streetNumber,
                                    lotNumber: content.unloadLocation[0].lotNumber === '' ? undefined : content.unloadLocation[0].lotNumber
                                },
                                saveUnloadLocation: "false",
                                items: {
                                    tradeCardItem: {
                                        tradeReason: "S",
                                        productVtsz: productVtsz,
                                        productName: productName,
                                        weight: items[i].loadedWeight * 1000
                                    }
                                }
                            }
                        }
                    }
                );

                // if (content.loadLocation[0].zipCode !== undefined) {
                //   tradCard.deliveryPlans.deliveryPlan.loadLocation
                // }
                //
                // if (content.unloadLocation[0].zipCode !== undefined) {
                //
                // }

                if (items[i].carrier.name !== ngivrService.strings.notSelected) {
                    tradeCard.carrier = items[i].carrier.ekaerNumber;
                    tradeCard.carrierText = items[i].carrier.name;
                }

                if (!isBlank(items[i].plateNumber1)) {
                    tradeCard.vehicle = {
                        plateNumber: items[i].plateNumber1,
                        country: items[i].country1
                    }
                }

                if (!isBlank(items[i].plateNumber2)) {
                    tradeCard.vehicle2 = {
                        plateNumber: items[i].plateNumber2,
                        country: items[i].country2
                    }
                }

                if (!isBlank(items[i].loadDate)) {
                    Date.parse(items[i].loadDate);

                    let date = new Date(Date.parse(items[i].loadDate));
                    //date.setDate(date.getDate() + 1);
                    tradeCard.loadDate = date.toLocalISOString()
                }
                if (!isBlank(items[i].arrivalDate)) {
                    Date.parse(items[i].arrivalDate);

                    let date = new Date(Date.parse(items[i].arrivalDate));
                    //date.setDate(date.getDate() + 1);
                    tradeCard.arrivalDate = date.toLocalISOString()
                }


                tradeCards.push({operation: 'create', ekaer: tradeCard})
            }

            ngivrHttp.post('/api/ekaers', tradeCards).then(async (response) => {

                if (response.data.result.funcCode !== 'OK') {
                    content.ekaerError = (response.data.result.msg);
                    return cb({globalError: response.data.result.msg})

                } else {
                    let success = true;
                    let ekaers = response.data.tradeCardOperationsResults.operationResult;

                    if (!ekaers.length) {
                        ekaers = [ekaers];
                    }
                    for (let i in items) {
                        if (ekaers[i].result.funcCode !== 'OK') {
                            ekaerErrors.push(ekaers[i].result.msg);
                            items[i].ekaerError = (ekaers[i].result.msg)
                            success = false
                        } else {
                            items[i].tcn = ekaers[i].tradeCardInfo.tcn;
                            items[i].tcnStatus = 'S';
                            items[i].ekaerError = undefined;
                            content.ekaerError = undefined;
                            items[i].checkedTcn = false;
                            if (items[i]._id) {
                                await ngivrHttp.put('/api/orderVehicles/' + items[i]._id, items[i]);
                            }


                        }
                    }
                    if (success) {
                        ngivrService.growl('EKAER igénylés sikeres!', 'info')
                    }
                    for (let i = items.length - 1; i >= 0; i--) {
                        if (!items[i].ekaerError) {
                            items.splice(i, 1)
                        }
                    }
                    // items = []; //TODO csak akkor legyen nullázva, ha nincs hiba az EKAER kérésben
                    return cb({vehicles: items})
                }
            });

        },


        /**
         * EKÁER módosítása
         * @param vehicle
         * @param content
         * @param cb
         */
        modifyTcn: (vehicle, content, showGrowl, cb) => {

            // if (vehicle.plateNumber1Full && vehicle.plateNumber1 !== vehicle.plateNumber1Full.name) {
            //   vehicle.plateNumber1 = vehicle.plateNumber1Full.name;
            // }
            // else if (vehicle.plateNumber1Full === null) {
            //   vehicle.plateNumber1 = null
            // }

            // if (vehicle.plateNumber2Full && vehicle.plateNumber2 !== vehicle.plateNumber2Full.name) {
            //   vehicle.plateNumber2 = vehicle.plateNumber2Full.name;
            // }
            // else if (vehicle.plateNumber1Full === null) {
            //   vehicle.plateNumber2 = null
            // }

            ngivrHttp.get('/api/ekaers/lastTcn/' + vehicle.tcn).then(function (response) {
                function isBlank(str) {
                    return (!str || /^\s*$/.test(str));
                }

                let tradeCard = response.data;
                if (tradeCard.deliveryPlans[0].deliveryPlan.items[0].tradeCardItem.hasOwnProperty('valueModReasonText')) {
                    delete tradeCard.deliveryPlans[0].deliveryPlan.items[0].tradeCardItem.valueModReasonText
                }

                if (tradeCard.deliveryPlans[0].deliveryPlan.items[0].tradeCardItem.hasOwnProperty('weightModReasonText')) {
                    delete tradeCard.deliveryPlans[0].deliveryPlan.items[0].tradeCardItem.weightModReasonText
                }

                if (tradeCard.hasOwnProperty('plateNumberModReasonText')) {
                    delete tradeCard.plateNumberModReasonText
                }

                tradeCard.modByCarrierEnabled = content.modByCarrierEnabled; //fuvarozó általi módosítás engedélyezése

                if (vehicle.carrier.name !== 'Nincs') {

                    tradeCard.carrier = vehicle.carrier.ekaerNumber;
                    tradeCard.carrierText = vehicle.carrier.name;

                }
                if (!isBlank(vehicle.loadDate)) {
                    Date.parse(vehicle.loadDate);

                    let date = new Date(Date.parse(vehicle.loadDate));
                    //date.setDate(date.getDate() + 1);
                    tradeCard.loadDate = date.toLocalISOString()
                }

                if (!isBlank(vehicle.arrivalDate)) {
                    Date.parse(vehicle.arrivalDate);

                    let date = new Date(Date.parse(vehicle.arrivalDate));
                    //date.setDate(date.getDate() + 1);
                    tradeCard.arrivalDate = date.toLocalISOString()
                }
                // if (tradeCard.deliveryPlans[0].deliveryPlan.items[0].tradeCardItem.weight !== vehicle.loadedWeight * 1000) {
                //   tradeCard.deliveryPlans[0].deliveryPlan.items[0].tradeCardItem.weight = vehicle.loadedWeight * 1000;
                //   tradeCard.deliveryPlans[0].deliveryPlan.items[0].tradeCardItem.weightModReasonText = 'Súly pontosítása'
                // }
                if (tradeCard.deliveryPlans[0].deliveryPlan.items[0].tradeCardItem.weight !== vehicle.nettoWeight * 1000) {
                    tradeCard.deliveryPlans[0].deliveryPlan.items[0].tradeCardItem.weight = vehicle.nettoWeight * 1000;
                    tradeCard.deliveryPlans[0].deliveryPlan.items[0].tradeCardItem.weightModReasonText = 'Súly pontosítása'
                }
                if (typeof tradeCard.vehicle !== 'undefined' && tradeCard.vehicle.plateNumber !== vehicle.plateNumber1) {

                    if (vehicle.plateNumber1 !== null) {
                        tradeCard.plateNumberModReasonText = 'Rendszám módosítása';

                        tradeCard.vehicle = {plateNumber: vehicle.plateNumber1, country: vehicle.country1}
                    } else {
                        tradeCard.plateNumberModReasonText = 'Rendszám törlése';
                        delete tradeCard.vehicle
                    }

                } else {
                    if (!isBlank(vehicle.plateNumber1)) {
                        tradeCard.plateNumberModReasonText = 'Rendszám megadása';
                        tradeCard.vehicle = {plateNumber: vehicle.plateNumber1, country: vehicle.country1}
                    }

                }
                if (typeof tradeCard.vehicle2 !== 'undefined' && tradeCard.vehicle2.plateNumber !== vehicle.plateNumber2) {

                    if (vehicle.plateNumber2 !== null) {
                        tradeCard.plateNumberModReasonText = 'Rendszám módosítása';

                        tradeCard.vehicle2 = {plateNumber: vehicle.plateNumber2, country: vehicle.country2}
                    } else {
                        tradeCard.plateNumberModReasonText = 'Rendszám törlése';
                        delete tradeCard.vehicle2
                    }

                } else {
                    if (!isBlank(vehicle.plateNumber2)) {
                        tradeCard.plateNumberModReasonText = 'Rendszám megadása';
                        tradeCard.vehicle2 = {plateNumber: vehicle.plateNumber2, country: vehicle.country2}
                    }
                }
                let modifiedTradeCards = [{operation: 'modify', ekaer: tradeCard}];

                ngivrHttp.post('/api/ekaers/modifyTcn', modifiedTradeCards).then(function (response) {
                    //console.log(response);
                    if (response.data.result.funcCode !== 'OK') {
                        content.ekaerError = (response.data.result.msg);
                        //ngivrService.growl('EKÁER módosítás sikertelen. Hiba: ' + response.result.msg)
                        return cb({globalError: response.data.result.msg})
                    } else {
                        let ekaer = response.data.tradeCardOperationsResults.operationResult[0];
                        if (ekaer.result.funcCode !== 'OK') {
                            vehicle.ekaerError = (ekaer.result.msg);
                            //ngivrService.growl('EKÁER módosítás sikertelen. Hiba: ' + ekaer.result.msg)
                            return cb({vehicles: [vehicle]});
                        } else {
                            vehicle.tcn = ekaer.tradeCardInfo.tcn;
                            vehicle.ekaerError = undefined;
                            content.ekaerError = undefined;
                            vehicle.checkedTcn = false;
                            ngivrHttp.put('/api/orderVehicles/' + vehicle._id, vehicle).then(() => {
                                if (showGrowl) {
                                    ngivrService.growl('Sikeres EKÁER módosítás', 'info');
                                }

                                return cb({vehicles: []});
                            });
                        }
                    }
                });
            });
        },

        /**
         * EKÁER véglegesítés
         * @param vehicles
         * @param content
         * @param cb
         */
        finalizeTcn: (vehicles, content, cb) => {
            let tradeCards = [];

            for (let i in vehicles) {
                let tradeCard = {
                    operation: 'finalize',
                    ekaer: {tcn: vehicles[i].tcn}
                };
                tradeCards.push(tradeCard)
            }
            //tradeCards = [{operation: 'finalize', ekaer: {tcn: vehicle.tcn}}];

            ngivrHttp.post('/api/ekaers/finalizeTcn', tradeCards, cb).then(function (response) {
                console.log(response);
                let ekaerErrors = [];
                if (response.data.result.funcCode !== 'OK') {
                    content.ekaerError = (response.result.msg);
                    return cb({globalError: response.data.result.msg})
                } else {
                    let ekaers = response.data.tradeCardOperationsResults.operationResult;
                    if (!ekaers.length) {
                        ekaers = [ekaers];
                    }
                    for (let i in vehicles) {
                        if (ekaers[i].result.funcCode !== 'OK') {
                            ekaerErrors.push(ekaers[i].result.msg);
                            vehicles[i].ekaerError = (ekaers[i].result.msg)
                        } else {
                            vehicles[i].tcn = ekaers[i].tradeCardInfo.tcn;
                            vehicles[i].tcnStatus = 'F';
                            vehicles[i].ekaerError = undefined;
                            content.ekaerError = undefined;
                            vehicles[i].checkedTcn = false;
                            delete vehicles[i].__v;
                            ngivrHttp.put('/api/orderVehicles/' + vehicles[i]._id, vehicles[i]).then((response) => {
                                //ngivrService.growl(response.data.tcn + ' sz. EKÁER sikeresen lezárva', 'info')
                            });
                        }
                    }
                    for (let i = vehicles.length - 1; i >= 0; i--) {
                        if (!vehicles[i].ekaerError) {
                            vehicles.splice(i, 1)
                        }
                    }
                }
                //vehicles = []; //TODO csak akkor legyen nullázva, ha nincs hiba az EKAER kérésben
                return cb({vehicles: vehicles})
            })
        },

        /**
         * EKÁER törlése
         */
        deleteTcn: (vehicles, content, statusChangeModReasonText, cb) => {
            let tradeCards = [];
            for (let i in vehicles) {
                let tradeCard = {
                    operation: 'delete',
                    ekaer: {tcn: vehicles[i].tcn, statusChangeModReasonText: statusChangeModReasonText}
                };
                tradeCards.push(tradeCard)
            }
            ngivrHttp.post('/api/ekaers/deleteTcn', tradeCards).then(function (response) {
                let ekaerErrors = [];

                if (response.data.result.funcCode !== 'OK') {
                    content.ekaerError = (response.result.msg);
                    return cb({globalError: response.data.result.msg})

                } else {
                    let ekaers = response.data.tradeCardOperationsResults.operationResult;

                    if (!ekaers.length) {
                        ekaers = [ekaers];
                    }
                    for (let i in vehicles) {
                        if (ekaers[i].result.funcCode !== 'OK') {
                            ekaerErrors.push(ekaers[i].result.msg);
                            vehicles[i].ekaerError = (ekaers[i].result.msg)

                        } else {
                            vehicles[i].tcn = ekaers[i].tradeCardInfo.tcn;
                            vehicles[i].tcnStatus = 'I';
                            vehicles[i].ekaerError = undefined;
                            content.ekaerError = undefined;
                            vehicles[i].checkedTcn = false;
                            ngivrHttp.put('/api/orderVehicles/' + vehicles[i]._id, vehicles[i]).then((response) => {
                                ngivrService.growl(response.data.tcn + ' sz. EKÁER sikeresen törölve', 'info')
                            });
                        }
                    }
                    for (let i = vehicles.length - 1; i >= 0; i--) {
                        if (!vehicles[i].ekaerError) {
                            vehicles.splice(i, 1)
                        }
                    }
                }
                return cb({vehicles: vehicles});
            })
        }

    }
});
