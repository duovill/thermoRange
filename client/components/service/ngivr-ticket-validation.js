'use strict';
ngivr.angular.factory('ngivrTicketValidation', ($http, ngivrService, ngivrGrowl, ngivrApi, ngivrPrompt, Auth) => {

    let ngivrTicketValidationFactory = {};

    function checkInTicketHasRelation(ticket) {
        let result = false;

        for (let i in ticket.ledger) {
            if (ticket.ledger[i].relatedTicketId != null || ticket.ledger[i].relatedTicketId !== undefined) {
                result = true;
            }
        }

        return result;
    }

    function checkVehicleHasTicket(doc, cb) {

        if (doc.inTicket || doc.outTicket) {
            return cb(true);
        }
        else {
            return cb(false);
        }

    }

    async function checkVehicleHasDeletableTicket(doc, shipOnType, cb) {
        if (doc.inTicket && shipOnType === 'bvsz') {
            let response = await ngivrApi.query('ticket', {search: {ledger: {$elemMatch: {subTicketName: doc.inTicket}}}});
            let ticketId = response.data.docs[0]._id;
            response = await ngivrApi.query('ticket', {search: {parentTicketId: ticketId, direction: 'out'}});
            for (let ticket of response.data.docs) {
                if (!ticket.deleted) {
                    ngivrGrowl(`Nem lehet törölni a járművet, mert rendelkezik in tickettel és tartozik hozzá out ticket. A kimenő ticket sorszáma: ${ticket.ticketName}`);
                    return cb ? cb(false) : false;
                }
            }
        }

        if (doc.inTicket || doc.outTicket && shipOnType !== 'bfk') {

            if (doc.outTicket && shipOnType !== 'int') {
                ngivrGrowl('Nem lehet törölni a járművet, mert rendelkezik in tickettel és tartozik hozzá out ticket');
                return cb ? cb(false) : false;
            }

            let query = {
                deleted: false,
                subTicketName: doc.inTicket ? doc.inTicket : doc.outTicket
            };

            let response = await $http.get('/api/tickets/', {params: query});


                if (response.data[0].direction === "in" && response.data[0].outTransferFIFOList.length > 0) {
                    ngivrGrowl('Nem lehet törölni a járművet, mert rendelkezik tickettel');
                    return cb ? cb(false) : false;
                }
                else {
                    if (checkInTicketHasMoreLedger(response.data[0])) {
                        ngivrGrowl('A mérlegjegy több diszpozícióra is teljesít, kérem törlés előtt helyezze át az itt lévő a mennyiséget másik diszpozícióra!');
                        return cb ? cb(false) : false;
                    }
                    else {
                        return cb ? cb(true) : true;
                    }
                }

        }
        // else if (doc.outTicket && shipOnType === 'bvsz') {
        //
        // }
        else {
            return cb ? cb(true) : true;
        }

    }

    async function checkVehicleHasDeletableTCN(doc, shipOnType, cb) {

        let response = await checkVehicleHasDeletableTicket(doc, shipOnType);
            let hasDeletableTicket = response;

            if (doc.tcn) { //ha van EKÁER szám, de nincs ticket,  töröljük az EKÁERt és a sort is
                if (doc.tcnStatus === 'S' && hasDeletableTicket) {
                    return cb ? cb(true) : true;
                }
                else {
                    ngivrGrowl('Nem lehet törölni a járművet, mert rendelkezik lezárt EKAER-rel és/vagy tickettel ami nem törölhető');
                    return cb ? cb(false) : false;
                }
            }
            else {
                return cb ? cb(true) : true;
            }

    }

    async function setTicketToDeleted(doc, cb) {
        if (doc.inTicket || doc.outTicket) {
            try {
                let ticketDeleteReasonText = await ngivrPrompt({
                    title: 'Mérlegjegy törlés',
                    textContent: 'Kérem, adja meg a törlés okát!',
                    placeholder: 'Törlés oka',
                    ariaLabel: 'Törlés',
                    initialValue: 'Szállítás meghiúsult'
                });
                let query = {
                    deleted: false,
                    subTicketName: doc.inTicket ? doc.inTicket : doc.outTicket
                };

                let response = await $http.get('/api/tickets/', {params: query});
                let ticket = response.data[0];
                let currentUser = Auth.getCurrentUser();
                ticket.delete = {
                    reason: ticketDeleteReasonText,
                    date: new Date(),
                    userId: currentUser._id,
                    userName: currentUser.fullName,
                };
                ticket.deleted = true;
                delete ticket.__v;
                response = await $http.put('api/tickets/' + ticket._id, ticket);
                if (doc.inTicket && doc.outTicket) {
                    let query = {
                        deleted: false,
                        subTicketName: doc.outTicket
                    };

                    let response = await $http.get('/api/tickets/', {params: query});
                    const ticket = response.data[0];
                    ticket.deleted = true;
                    delete ticket.__v;
                    response = await $http.put('api/tickets/' + ticket._id, ticket);
                    if (cb) {
                        return cb(true);
                    }
                    // $http.put('api/tickets/'+ ticket._id, ticket).then(function () {
                    //   if (cb) {
                    //     return cb(true);
                    //   }
                    // })

                    //
                    // $http.get('/api/tickets/', {params: query}).then(function (response) {
                    //   const ticket = response.data[0];
                    //   ticket.deleted = true;
                    //   delete ticket.__v;
                    //   $http.put('api/tickets/'+ ticket._id, ticket).then(function () {
                    //     if (cb) {
                    //       return cb(true);
                    //     }
                    //   })
                    // })
                }
                else {
                    if (cb) {
                        return cb(true);
                    }
                }


                // $http.get('/api/tickets/', {params: query}).then(function (response) {
                //   const ticket = response.data[0];
                //   ticket.deleted = true;
                //   delete ticket.__v;
                //   $http.put('api/tickets/'+ ticket._id, ticket).then(function (response) {
                //
                //     if (doc.inTicket && doc.outTicket)
                //     {
                //       let query = {
                //         deleted: false,
                //         subTicketName: doc.outTicket
                //       };
                //
                //       $http.get('/api/tickets/', {params: query}).then(function (response) {
                //         const ticket = response.data[0];
                //         ticket.deleted = true;
                //         delete ticket.__v;
                //         $http.put('api/tickets/'+ ticket._id, ticket).then(function () {
                //           if (cb) {
                //             return cb(true);
                //           }
                //         })
                //       })
                //     }
                //     else {
                //       if (cb) {
                //         return cb(true);
                //       }
                //     }
                //   });
                // })
            } catch (e) {
                console.error(e)
            }


        }
    }

    async function checkVehiclesHasTCN(docs) {
        for (let i in docs) {
            if (docs[i].tcn && docs[i].tcnStatus === 'S') {
                return true;
            }
        }

        return false;
    }

    function checkInTicketHasMoreLedger(ticket) {

        if (ticket.ledger.length === 1) {
            return false;
        }
        else {
            return true;
        }
    }

    function checkVehicleHasDeletedTicket(doc, cb) {

        if (doc.inTicket || doc.outTicket) {

            let query = {
                deleted: false,
                subTicketName: doc.inTicket ? doc.inTicket : doc.outTicket
            };

            $http.get('/api/tickets/', {params: query}).then(function (response) {

                if (response.data[0].deleted) {
                    return cb(true);
                }
                else {
                    return cb(false);
                }
            });
        }
        else {
            return cb(false);
        }

    }

    ngivrTicketValidationFactory.checkInTicketHasRelation = checkInTicketHasRelation;
    ngivrTicketValidationFactory.checkVehicleHasTicket = checkVehicleHasTicket;
    ngivrTicketValidationFactory.checkVehicleHasDeletableTCN = checkVehicleHasDeletableTCN;
    ngivrTicketValidationFactory.setTicketToDeleted = setTicketToDeleted;
    ngivrTicketValidationFactory.checkVehiclesHasTCN = checkVehiclesHasTCN;
    ngivrTicketValidationFactory.checkInTicketHasMoreLedger = checkInTicketHasMoreLedger;
    ngivrTicketValidationFactory.checkVehicleHasDeletedTicket = checkVehicleHasDeletedTicket;
    ngivrTicketValidationFactory.checkVehicleHasDeletableTicket = checkVehicleHasDeletableTicket;

    return ngivrTicketValidationFactory;
});
