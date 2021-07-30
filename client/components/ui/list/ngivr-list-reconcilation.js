'use strict';
ngivr.angular.directive('ngivrListReconcilation', (ngivrException) => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            invoice: '=',
            variables: '=',
            reconcilationId: '<'

        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-reconcilation.html',
        controller: class {

            constructor($scope, Common, socket, Auth, $timeout, ngivrLockList) {

                $scope.overlay = 0;

                $scope.sort = {
                    position: 'before',
                    items: [
                        {
                            key: 'fulfillmentDate',
                            display: 'Teljesítés dátuma',
                            sort: {'fulfillmentDate': true}
                        },

                    ]
                };

                $scope.ngivrLockListInstances = {
                    tickets: ngivrLockList({
                        scope: $scope,
                        schema: 'ticket',
                        watch: 'ticketsToLock',
                        list: true,
                        listKeepLockonUpdate: true,
                        onUnlock: (options) => {

                        },
                        onAutoUnlockOrError: async (options) => {
                            if (options.doc.secondarySelected) {
                                $scope.publish('clearForm', options.doc)
                            }
                            await $scope.deselectTicket(options.doc, {autoUnlock: true});
                        }
                    }),
                    orders: ngivrLockList({
                        scope: $scope,
                        schema: 'orderInList',
                        watch: 'ordersToLock',
                        list: true,
                        listKeepLockonUpdate: true,
                        debug: false,
                        onUnlock: (options) => {

                        },
                        onAutoUnlockOrError: (options) => {
                        }
                    })
                };

                this.$scope = $scope;


                $scope.$on(ngivr.settings.event.client.list.clear, () => {
                    $scope.inputSearch = undefined;
                });

                $scope.$on(ngivr.settings.event.client.list.loaded, async (data) => {

                    $scope.docs = data.targetScope.query.docs;
                    $scope.ticketsToLock = [];
                    $scope.ordersToLock = [];
                    for (let doc of $scope.docs) {
                        if (doc.ticketName) {
                            $scope.ticketsToLock.push(doc.tickets[0])
                        } else {
                            $scope.ordersToLock.push({_id: doc._id.orderId});
                            for (let ticket of doc.tickets) {
                                $scope.ticketsToLock.push(ticket)
                            }
                        }
                    }

                });

                $scope.subscribe('selectsChangedInRight', async (options) => {
                    let {selects, ticket} = options;

                    if (ticket.orderId) {
                        await $scope.unlockOrder(ticket.orderId)
                    }

                    await $scope.ngivrLockListInstances.tickets.unlockDocument({
                        doc: ticket
                    });

                    $scope.selects = selects
                });
                $scope.selects = {
                    tickets: [],
                    orders: []
                };

                // $scope.$watch('url', function(newValue, oldValue){
                //   if (newValue !== oldValue) ngivr.list.requery($scope);
                //  });

                $scope.detailedOrders = [];

                /**
                 * Ticket kiválasztása (elsődleges select)
                 * @param ticket
                 * @param orderId
                 * @param idx
                 * @param pIdx
                 * @param ticketsInOrder
                 */

                $scope.selectTicket = async function (ticket, orderId, idx, pIdx, ticketsInOrder) {

                    try {
                        $scope.overlay++;
//                        if (ticket.ticketType !== 'possessionTransfer' && $scope.selects.tickets.length === 0) {
                        if (ticket.ticketType !== 'possessionTransfer' && !(await $scope.ngivrLockListInstances.orders.isDocumentLockedByMe({doc: {_id: orderId}}))) {

                            await $scope.ngivrLockListInstances.orders.lockDocument({doc: {_id: orderId}})
                        }
                        $scope.selects.tickets.push({id: ticket._id, selectable: true, ledgerId: ticket.ledger[0]._id});

                        let contractId = '';
                        if (ticket.ticketType !== 'possessionTransfer') { //ha nem birtokátruházós a ticket
                            for (let i in ticket.ledger) {
                                if (ticket.ledger[i].orderId === orderId) {
                                    contractId = ticket.ledger[i].contractId
                                }
                            }
                        } else {
                            contractId = ticket.ledger[0].contractId
                        }
                        ticket.index = idx;
                        ticket.parentIndex = pIdx;
                        if ($scope.selectedTickets === undefined) {
                            $scope.selectedTickets = [];
                        }
                        if (!ticket.needInvoice) {
                            ticket.needInvoice = true
                        }

                        $scope.variables.selectedTickets.push(ticket);
                        if (ticket.ticketType !== 'possessionTransfer') $scope.checkOrder(ticket, orderId, ticketsInOrder);
                        $scope.publish('selectsChangedInReconcilationList', $scope.selects);
                        await $scope.ngivrLockListInstances.tickets.lockDocument({
                            doc: ticket
                        })
                        //await ngivrLockService.lock('ticket:' + ticket._id); //TODO ttl
                        // $scope.lockTicket(ticket._id, ticket, true)

                    } catch (e) {
                        ngivrException.handler(e)
                    } finally {
                        $scope.overlay--;
                    }


                };

                /**
                 * Ellenőrzi, hogy adott order minden ticketje selectelve van-e
                 * Ha igen, akkor selecteltre állítja az order checkboxát
                 * @param ticket
                 * @param orderId
                 * @param ticketsInOrder
                 */
                $scope.checkOrder = async (ticket, orderId, ticketsInOrder) => {
                    let selectedTicketsOfOrder = $scope.variables.selectedTickets.filter((o) => {
                        return o.orderId === orderId
                    });
                    if (selectedTicketsOfOrder.length === ticketsInOrder) {
                        let secondarySelectedTickets = $scope.variables.selectedTickets.filter(function (o) {
                            return o.orderId === orderId && o.secondarySelected
                        });
                        if (secondarySelectedTickets.length) {
                            $scope.selects.orders.push({id: orderId, selectable: false});
                        } else {
                            $scope.selects.orders.push({id: orderId, selectable: true});
                        }
                    }
                };

                $scope.unlockOrder = async (orderId) => {
                    let selectedTicketsOfOrder = $scope.variables.selectedTickets.filter((o) => {
                        return o.orderId === orderId
                    });
                    if (!selectedTicketsOfOrder.length) {
                        await $scope.ngivrLockListInstances.orders.unlockDocument({doc: {_id: orderId}})
                    }
                };

                /**
                 * Kiválasztott ticket törlése a jobb oldali listából
                 * @param ticket
                 * @param options
                 */
                $scope.deselectTicket = async function (ticket, options = {}) {
                    try {
                        $scope.overlay++;

                        const tIdx = Common.functiontofindIndexByKeyValue($scope.selects.tickets, 'ledgerId', ticket.ledger[0]._id);
                        $scope.selects.tickets.splice(tIdx, 1);
                        const idx = Common.functiontofindIndexByKeyValue($scope.variables.selectedTickets, '_id', ticket._id);
                        $scope.variables.selectedTickets.splice(idx, 1);
                        let autoUnlock = false;

                        if (options.hasOwnProperty('autoUnlock')) {
                            autoUnlock = true
                        }

                        if (ticket.orderId) {
                            const oIdx = Common.functiontofindIndexByKeyValue($scope.selects.orders, 'id', ticket.orderId);
                            if (oIdx !== null) {
                                $scope.selects.orders.splice(oIdx, 1);

                            }

                            if (!autoUnlock) {
                                await $scope.unlockOrder(ticket.orderId)
                            }


                        }


                        if (!autoUnlock) {
                            await $scope.ngivrLockListInstances.tickets.unlockDocument({
                                doc: ticket
                            })
                        }

                        //await ngivrLockService.unlock('ticket:' + ticket._id);
                        // $scope.lockTicket(ticket._id, ticket, false);
                        // $scope.socketService.get();
                    } catch (e) {
                        ngivrException.handler(e)
                    } finally {
                        $scope.overlay--;
                    }

                };

                /**
                 * Számlaegyeztető bal oldali listában orderekhez tartozó ticketek kiválasztása egyszerre
                 * @param order
                 * @param index
                 * @param ticketsInOrder
                 */
                $scope.selectAllTicketsInOrder = async function (order, index, ticketsInOrder) {
                    for (let i in order.tickets) {
                        if (Common.functiontofindIndexByKeyValue($scope.selects.tickets, 'ledgerId', order.tickets[i].ledger[0]._id) === null) {
                            await $scope.selectTicket(order.tickets[i], order._id.orderId, i, index, ticketsInOrder)
                        }
                    }
                    $scope.showTickets(order._id.orderId)

                };

                /**
                 * Számlaegyeztető bal oldali listában orderekhez tartozó ticketek kiválasztásának törlése egyszerre
                 * @param order
                 * @param index
                 */
                $scope.deselectAllTicketsIndOrder = async function (order, index) {
                    const oIdx = Common.functiontofindIndexByKeyValue($scope.selects.orders, 'id', order._id.orderId);
                    $scope.selects.orders.splice(oIdx, 1);
                    for (let i in order.tickets) {
                        await $scope.deselectTicket(order.tickets[i], order._id.orderId, i, index)
                    }
                    //order.selected = false

                };

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
                        for (let i in $scope.selects.orders) {
                            if ($scope.selects.orders[i].id === id) {
                                return true
                            }
                        }
                    }
                    return false
                };

                /**
                 * a $scope.detailedOrders tömbben tároljuk azoknak az ordereknek az id-ját,
                 * amelyeknél mutatjuk a ticket-listát
                 * @param id
                 * @param close
                 */
                $scope.showTickets = (id, close) => {
                    if ($scope.detailedOrders.includes(id)) {
                        $scope.detailedOrders.splice($scope.detailedOrders.indexOf($scope.detailedOrders, id), 1)
                    } else {
                        $scope.detailedOrders.push(id)
                    }
                };

                /**
                 * Ticket, illetve order választhatóságának ellenőrzése
                 * @param id
                 * @param type
                 * @param doc
                 * @returns {boolean}
                 */
                $scope.isSelectable = (id, type, doc) => {
                    if (type === 'ticket') { //ha ticket
                        for (let i in $scope.selects.tickets) {
                            if ($scope.selects.tickets[i].id === id) {
                                return $scope.selects.tickets[i].selectable
                            }
                        }


                        return !$scope.ngivrLockListInstances.tickets.isDocumentLocked({
                            doc: {_id: id}
                        })

                    } else {   //ha order
                        for (let i in $scope.selects.orders) {
                            if ($scope.selects.orders[i].id === id) {
                                return $scope.selects.orders[i].selectable
                            }
                        }


                        try {
                            for (let ticket of doc.tickets) {
                                if ($scope.ngivrLockListInstances.tickets.isDocumentLocked({
                                        doc: {_id: ticket._id}
                                    })) {
                                    return false
                                }
                            }
                        }
                        catch (e) {
                            console.warn('sorszám:', doc
                            );
                            console.warn(e)
                        }


                        return !$scope.ngivrLockListInstances.orders.isDocumentLocked({
                            doc: {_id: id}
                        });

                        // try {
                        //     let lock = $scope.redisLockList.filter((o) => {
                        //         return o.doc === 'order:' + id
                        //     });
                        //
                        //     if (!lock.length) return true;
                        //
                        //
                        //     if (lock[0].user !== Auth.getCurrentUser().nickName) return false;
                        //
                        // }
                        // catch (err) {
                        //     return true
                        // }

                    }
                    return false
                };
            }

            search(query) {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {

                    'contractPartner.name': {
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
