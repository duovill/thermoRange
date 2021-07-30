'use strict';
ngivr.angular.directive('ngivrListTicketsWithoutInvoice', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            invoice: '=',
            variables: '=',
            checkVat: '&'

        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-tickets-without-invoice.html',
        controller: class {

            constructor($scope, Common, socket, Auth, ngivrApi, $timeout, ngivrLockList, ngivrException) {
                this.$scope = $scope;
                $scope.currentUser = Auth.getCurrentUser();
                $scope.selects = {
                    contracts: [],
                    tickets: []
                };

                $scope.sort = {
                    position: 'before',
                    items: [
                        {
                            key: 'firstFulfillmentDate',
                            display: 'Száll. dátuma',
                            sort: 'firstFulfillmentDate'
                        },

                    ]
                };

                $scope.overlay = 0;

                $scope.$on(ngivr.settings.event.client.list.loaded, async (data) => {

                    $scope.docs = data.targetScope.query.docs;
                    $scope.ticketsToLock = [];
                    $scope.contractsToLock = [];
                    for (let doc of $scope.docs) {
                        $scope.contractsToLock.push(doc._id);
                        for (let ticket of doc.tickets) {
                            $scope.ticketsToLock.push(ticket)
                        }
                    }

                });

                $scope.ngivrLockListInstances = {
                    ticket: ngivrLockList({
                        scope: $scope,
                        schema: 'ticket',
                        watch: 'ticketsToLock',
                        list: true,
                        listKeepLockonUpdate: true,
                        docIdName: 'ticketId',
                        onUnlock: (options) => {

                        },
                        onAutoUnlockOrError: async (options) => {
                            await $scope.deselectTicket(options.doc, $scope.docs, false, true);
                        }
                    }),
                    contract: ngivrLockList({
                        scope: $scope,
                        schema: 'contractSelect',
                        watch: 'contractsToLock',
                        list: true,
                        listKeepLockonUpdate: true,
                        docIdName: 'contractId',
                        onUnlock: (options) => {

                        },
                        onAutoUnlockOrError: async (options) => {

                        }
                    })
                };

                $scope.detailedContracts = [];

                /**
                 * a $scope.detailedContracts tömbben tároljuk azoknak az ordereknek az id-ját,
                 * amelyeknél mutatjuk a ticket-listát
                 * @param id
                 */
                $scope.showTickets = (id, notClose) => {
                    if ($scope.detailedContracts.includes(id)) {
                        if (!notClose)
                        $scope.detailedContracts.splice($scope.detailedContracts.indexOf($scope.detailedContracts, id), 1)
                    } else {
                        $scope.detailedContracts.push(id)
                    }
                };

                // ha torles van, akkor igy kell hasznalni (ures lesz minden)
                $scope.$on(ngivr.settings.event.client.list.clear, () => {
                    $scope.inputSearch = undefined;
                });

                /**
                 * Ha változik a formban a számla, akkor
                 * a tabon os megváltoztatjuk
                 */
                $scope.subscribe('invoiceChangedInProductForm', async (invoice) => {
                    $scope.invoice = angular.copy(invoice);
                    if (invoice._id) {
                        $scope.selects.tickets = [];
                        $scope.selects.contracts = [];
                        if (!$scope.selects.tickets.length) {
                            $scope.ngivrQuery.search = {};
                            ngivr.list.requery($scope)
                        }
                    }
                });

                /**
                 * Ha a formban már nincs kiválasztott ticket, akkor
                 * újra lekérjük a számlát váró ticketek listáját
                 */
                $scope.subscribe('selectChangedInForm', (selects) => {
                    $scope.selects = selects;
                    if (!$scope.selects.tickets.length) {
                        $scope.ngivrQuery.search = {};
                        ngivr.list.requery($scope)
                    }
                });

                $scope.subscribe('setlockTicket', async (options) => {
                    //ticket lock oldása
                    await $scope.ngivrLockListInstances.ticket.unlockDocument({doc: options.ticket});
                    //ha a contract is lockolva van, akkor azt is oldjuk
                    const oId = Common.functiontofindIndexByKeyValue($scope.selects.contracts, 'id', options.ticket.ledger.contractId);
                    if (oId !== null) {
                        $scope.selects.contracts.splice(oId, 1);
                        await $scope.ngivrLockListInstances.contract.unlockDocument({doc: {contractId: options.ticket.ledger.contractId}})
                    }
                });

                /**
                 * Adott ticket, ill. order kiválasztásának ellenőrzése
                 * @param id
                 * @param type
                 * @returns {boolean}
                 */
                $scope.isSelected = (id, type) => {
                    if (type === 'ticket') {
                        for (let i in $scope.selects.tickets) {
                            if ($scope.selects.tickets[i].ledgerId === id) {
                                return true
                            }
                        }
                    } else {
                        for (let i in $scope.selects.contracts) {
                            if ($scope.selects.contracts[i].id === id) {
                                return true
                            }
                        }
                    }
                    return false
                };

                $scope.isLocked = (lockString) => {
                    try {
                        let lock = $scope.redisLockList.filter((o) => {
                            return o.doc === lockString
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
                 * Ticket, illetve order választhatóságának ellenőrzése
                 * @param id
                 * @param type
                 * @param ticketsOfContract
                 * @returns {boolean}
                 */
                $scope.isSelectable = (id, type, ticketsOfContract) => {
                    if (type === 'ticket') {
                        for (let i in $scope.selects.tickets) {
                            if ($scope.selects.tickets[i].id === id) {
                                return $scope.selects.tickets[i].selectable
                            }
                        }
                        // (async () => {
                        //     if ($scope.ngivrLockListInstances.ticket.isDocumentLocked({
                        //             doc: {ticketId: id}
                        //         })) {
                        //         ngivrGrowl(id)
                        //         return await $scope.ngivrLockListInstances.ticket.isDocumentLockedByMe({
                        //             doc: {ticketId: id}
                        //         })
                        //     } else {
                        //         return true
                        //     }
                        //
                        // })();

                        return !$scope.ngivrLockListInstances.ticket.isDocumentLocked({
                            doc: {ticketId: id}
                        })


                    } else {
                        for (let i in $scope.selects.contracts) {
                            if ($scope.selects.contracts[i].id === id) {
                                return $scope.selects.contracts[i].selectable
                            }
                        }

                        for (let ticket of ticketsOfContract) {
                            if ($scope.ngivrLockListInstances.ticket.isDocumentLocked({
                                    doc: {ticketId: ticket.ticketId}
                                })) {
                                return false
                            }

                        }
                        return !$scope.ngivrLockListInstances.contract.isDocumentLocked({
                            doc: {contractId: id}
                        })


                    }

                };

                /**
                 * Ticket kiválasztása a listában
                 * @param {object} options
                 * ticket
                 * orderId
                 * idx
                 * pIdx
                 * query
                 * contract
                 */
                $scope.selectTicket = async function (options) {
                    try {
                        $scope.overlay++;
                        if ($scope.invoice._id) $scope.invoice = new ngivr.model.outgoingInvoice({createdBy: $scope.currentUser});
                        //lockoljuk a ticketet
                        if (!options.moreLock) {
                            await $scope.ngivrLockListInstances.ticket.lockDocument({doc: options.ticket})

                        }
                        $scope.selects.tickets.push({id: options.ticket.ticketId, selectable: true, ledgerId: options.ticket.ledger._id});
                        let items = options.query.docs;
                        options.ticket.index = options.idx;
                        options.ticket.parentIndex = options.pIdx;
                        //options.ticket.options.orderId = options.orderId;
                        //options.ticket.selected = true;
                        $scope.variables.selectedTickets.push(options.ticket);
                        if ($scope.variables.selectedTickets.length === options.ticketLength) {
                            $scope.selects.contracts.push({
                                id: options.contract.contractId,
                                selectable: true,
                                ticketLength: options.ticketLength
                            });
                            await $scope.ngivrLockListInstances.contract.lockDocument({doc: {contractId: options.contract.contractId}})
                            //await ngivrLockService.lock('contractSelect:' + options.contract.contractId)
                        }

                        $scope.variables.selectedTickets[$scope.variables.selectedTickets.length - 1].discountType = 'none';
                        if ($scope.selects.tickets.length === 1) {
                            //$scope.invoice.payMode = 'transfer';
                            let response = await ngivrApi.query('fizmod', {
                                search: {
                                    FIZMOD_ALAPERT: 'T'
                                }
                            });
                            if ($scope.variables.selectedTickets.length === 1) {
                                $scope.invoice.relatedContract = options.contract;
                                $scope.invoice.payMode = response.data.docs[0];
                                let resp = await ngivrApi.id('partner', options.contract.partner[0]._id );
                                $scope.invoice.buyer = [resp.data.doc];
                                //$scope.variables.filterBy = options.ticket.contractPartner; //szűrünk partnerre
                                //var partnerIdx = Common.functiontofindIndexByKeyValue($scope.partners, '_id', options.ticket.contractPartner._id); //beállítjuk az adószámos legördülőt
                                $scope.variables.vatNumbers = $scope.invoice.buyer[0].vatNumbers;
                                if ($scope.invoice.buyer[0].vatNumbers.length === 1) $scope.checkVat({vatNumber: $scope.invoice.buyer[0].vatNumbers[0]});
                                $scope.ngivrQuery.search = {
                                    '_id.contractNumber': options.contract.contractNumber
                                };
                                ngivr.list.requery($scope)
                            }

                        }
                        $scope.publish('itemsChangeOnLeft', items);
                        $scope.publish('invoiceChangedInProductTab', $scope.invoice);
                        if (!options.moreTicketSelection) {
                            $scope.publish('selectChangedOnTab', $scope.selects)
                        }
                    } catch (e) {
                        ngivrException.handler(e)
                    } finally {
                        $scope.overlay--;
                    }

                };

                /**
                 * Ticket kiválasztásának törlése
                 * @param ticket
                 * @param query
                 * @param moreTicketSelection
                 * @param timedDeselect
                 */
                $scope.deselectTicket = async (ticket, query, moreTicketSelection, timedDeselect) => {
                    try {
                        $scope.overlay++;
                        // oldjuk a ticketlockot
                        if (!timedDeselect) {
                            await $scope.ngivrLockListInstances.ticket.unlockDocument({doc: ticket})

                            //await ngivrLockService.unlock('ticketSelect:' + ticket.ticketId);
                        }
                        const oId = Common.functiontofindIndexByKeyValue($scope.selects.contracts, 'id', ticket.ledger.contractId);
                        if (oId !== null) {
                            $scope.selects.contracts.splice(oId, 1);
                            await $scope.ngivrLockListInstances.contract.unlockDocument({doc: {contractId: ticket.ledger.contractId}})
                            // await ngivrLockService.unlock('contractSelect:' + ticket.ledger.contractId)
                        }

                        const selectedTicketsIdx = Common.functiontofindIndexByKeyValue($scope.selects.tickets, 'ledgerId', ticket.ledger._id);
                        $scope.selects.tickets.splice(selectedTicketsIdx, 1);
                        let items = query.docs;
                        let idx = Common.functiontofindIndexByKeyValue($scope.variables.selectedTickets, 'ticketId', ticket.ticketId);
                        delete ticket.discountValue;
                        delete ticket.discountType;
                        $scope.variables.selectedTickets.splice(idx, 1);
                        if (!$scope.selects.tickets.length) {
                            //$scope.variables.filterBy = false;
                            $scope.variables.vatNumbers = [];
                            $scope.invoice.vatNumber = undefined;
                            $scope.invoice = new ngivr.model.outgoingInvoice({createdBy: $scope.currentUser});
                            $scope.ngivrQuery.search = {};
                            ngivr.list.requery($scope)
                        }
                        $scope.publish('itemsChangeOnLeft', items);
                        $scope.publish('invoiceChangedInProductTab', $scope.invoice);
                        if (!moreTicketSelection) {
                            $scope.publish('selectChangedOnTab', $scope.selects)
                        }

                    } catch (e) {
                        ngivrException.handler(e)
                    } finally {
                        $scope.overlay--;
                    }

                };

                /**
                 * Adott contracthoz tartozó összes ticket kiválasztása
                 * @param doc
                 * @param query
                 */
                $scope.selectAllTicketsInContract = async function (doc, query) {
                    $scope.showTickets(doc._id.contractId, true);
                    for (let ticket of doc.tickets) {
                        if (!$scope.isSelected(ticket.ledger._id, 'ticket')) {
                            await $scope.selectTicket({
                                ticket: ticket,
                                query: query,
                                contract: doc._id,
                                moreTicketSelection: true,
                                ticketLength: doc.tickets.length,
                                //moreLock: true
                            });
                        }

                    }
                    //$scope.selects.contracts.push({id: doc._id.contractId, selectable: true});
                    //order.selected = true;
                    //order.showTickets = true;
                    //$scope.publish('itemsChangeOnLeft', items);
                    $scope.publish('selectChangedOnTab', $scope.selects)
                };

                /**
                 * Adott contracthoz tartozó összes ticket kiválasztásának törlése
                 * @param contract
                 * @param query
                 */
                $scope.deselectAllTicketsInContract = async function (contract, query) {
                    $scope.showTickets(contract._id.contractId, true);

                    for (let ticket of contract.tickets) {
                        await $scope.deselectTicket(ticket, query, true)

                    }
                    await $scope.ngivrLockListInstances.contract.unlockDocument({doc: {contractId: contract._id.contractId}});
                    const selectedOrdersIdx = Common.functiontofindIndexByKeyValue($scope.selects.contracts, 'id', contract._id.contractId);
                    $scope.selects.contracts.splice(selectedOrdersIdx, 1);
                    //$scope.clearInvoiceForm();
                    //$scope.publish('itemsChangeOnLeft', items);
                    $scope.publish('selectChangedOnTab', $scope.selects)
                }

                /* /!**
                  * Form adatainak 'nullázása'
                  *!/
                 $scope.clearInvoiceForm = function () {
                   delete $scope.invoice.partnerContractNumber;
                   delete $scope.invoice.contractPrice;
                   delete $scope.invoice.currency;
                   delete $scope.invoice.sustainability;
                   delete $scope.invoice.parity;
                   delete $scope.invoice.contractNumber;
                   delete $scope.invoice.payDays;
                   delete $scope.invoice.payDateType;
                   delete $scope.invoice.fulfillmentDate;
                   delete $scope.invoice.buyer;
                   delete $scope.invoice.sum;
                   delete $scope.invoice.vatBase;
                   delete $scope.invoice.vat;
                   delete $scope.invoice.vatValue;
                   delete $scope.invoice.endSum;
                   $scope.invoice.summaryPerProduct = []

                 }*/

            }

            search(query) {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {

                    '_id.partner.name': {
                        '$regex': search,
                        '$options': 'i'
                    },


                };
                query.sort = {'updatedAt': -1}
            }

            show() {
                alert('show');
            }

        }
    }
});
