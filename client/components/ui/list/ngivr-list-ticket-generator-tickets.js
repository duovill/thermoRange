'use strict';
ngivr.angular.directive('ngivrListTicketGeneratorTickets', ($state) => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            ticketSelected: '=',
            showFilter: '<'
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-ticket-generator-tickets.html',
        controller: function ($scope, ngivrConfirm, ngivrService, ngivrHttp, ngivrApi, ngivrGrowl, $rootScope, ngivrPrompt, Auth, $interval) {
            const intervalPromise = $interval(() => {
                if ($scope.ngivrQuery !== undefined) {

                    $interval.cancel(intervalPromise);
                    start();
                }
            }, 100);

            const start = () => {
                this.$scope = $scope;
                this.$scope.$state = $state;

                // ha torles van, akkor igy kell hasznalni (ures lesz minden)
                $scope.$on(ngivr.settings.event.client.list.clear, () => {
                    $scope.inputSearch = undefined;
                    $scope.product = undefined;
                    $scope.direction = 'all';
                    $scope.owner = 'all';
                    $scope.from = undefined;
                    $scope.plateNumber = undefined;
                    $scope.to = undefined;
                    $scope.tcn = undefined;
                    $scope.partner = undefined;
                    $scope.sygnus = true;
                    $scope.weighingHouse = undefined;
                    $scope.productGroup = {name: 'Összes', _id: 1};
                    if (!$scope.userSite) {
                        $scope.site = undefined
                    }
                });

                $scope.productGroup = {name: 'Összes', _id: 1};

                $scope.$watch('productGroup', (newVal, oldVal) => {
                    if ($scope.product && ($scope.product.productGroupName !== newVal.name && newVal.name !== 'Összes')) {
                        $scope.product = undefined
                    }
                }, true);

                $scope.$watchGroup(['from', 'to'], (n, l) => {
                    // console.log("Query was built");
                    if ($scope.ngivrQuery) {
                        this.search($scope.ngivrQuery);
                        ngivr.list.requery($scope);
                    }


                });

                $scope.getPlace = (doc) => {
                    switch (doc.direction) {
                        case 'in':
                            return doc.depot.name;

                        case 'out':
                            if (doc.ship && doc.ship.name) {
                                return doc.ship.name
                            } else {
                                return doc.depot.name
                            }
                        //return doc.ship ? doc.ship.name || doc.depot.name;

                        case 'external_in':
                            return doc.targetDepot ? doc.depot.name : doc.ship.name;

                        case 'external_out':
                            break;
                        case 'internal_in':
                            return doc.depot.name;

                        case 'internal_out':
                            return doc.depot.name;

                    }
                };

                /**
                 * Mérlegjegy listában ticket törlése
                 * @param ticket
                 * @param $event
                 * @returns {Promise<void>}
                 */
                $scope.deleteOutTicketAndVehicleFromBfk = async (ticket, $event) => {
                    if ($event !== undefined) {
                        $event.stopImmediatePropagation();
                    }
                    try {
                        let currentUser = Auth.getCurrentUser();

                        let reason = await ngivrPrompt({
                            title: 'Mérés törlése',
                            textContent: 'Kérem, adja meg a törlés okát!',
                            placeholder: 'Törlés oka',
                            ariaLabel: 'Törlés',
                            initialValue: undefined
                        });

                        ticket.delete = {
                            reason: reason,
                            date: new Date(),
                            userId: currentUser._id,
                            userName: currentUser.fullName
                        };
                        ticket.deleted = true;
                        delete ticket.__v;
                        await ngivrHttp.put('api/tickets/' + ticket._id, ticket);
                        for (let ledger of ticket.ledger) {
                            let resp = await ngivrApi.query('orderVehicle', {search: {$or: [{outTicket: ledger.subTicketName}, {inTicket: ledger.subTicketName}]}});
                            let vehicle = resp.data.docs[0];
                            if (ticket.direction === 'internal_in') {
                                if (!ticket.itk) {
                                    vehicle.inTicketDeleted = true;

                                } else { // itk-s ticket esetén törölni kell az intenal_out ticketet is
                                    let outResp = await ngivrApi.id('ticket', ticket.childInternalOutTicket);
                                    let outTicket = outResp.data.doc;
                                    outTicket.deleted = true;
                                    delete outTicket.__v;
                                    await ngivrHttp.put('api/tickets/' + outTicket._id, outTicket);
                                    vehicle.ticketDeleted = true;
                                }

                            } else if (!vehicle.tcn) {
                                vehicle.ticketDeleted = true;

                            }

                            if (vehicle.tcn) {
                                vehicle.tcnUsed = false;

                                vehicle.inTicketDeleted = true;
                                if (ticket.direction === 'out') {
                                    vehicle.outTicketDeleted = true
                                }

                                // if (ticket.direction === 'in' || ticket.direction === 'internal_in') {
                                //     vehicle.inTicketDeleted = true;
                                // } else {
                                //     vehicle.outTicketDeleted = true
                                // }

                            }
                            await ngivrApi.save('orderVehicle', vehicle);
                            ngivrGrowl('Sikeres törlés')
                        }
                    } catch (error) {
                        console.error(error)
                    }


                    //return
                };

                this.search = (query) => {
                    const $scope = this.$scope;
                    const search = $scope.inputSearch;
                    let conditions = [];
                    let inputSearch
                    if ($scope.inputSearch) {
                        inputSearch = {
                            $or: [
                                {
                                    'productName': {
                                        '$regex': search,
                                        '$options': 'i'
                                    }
                                },
                                {
                                    'ship.name': {
                                        '$regex': search,
                                        '$options': 'i'
                                    }
                                },
                                {
                                    'ownerName': {
                                        '$regex': search,
                                        '$options': 'i'
                                    }
                                },
                                {
                                    'depot.name': {
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
                                    'plateNumber2': {
                                        '$regex': search,
                                        '$options': 'i'
                                    }
                                }
                            ]
                        };
                        conditions.push(inputSearch)
                    }
                    //if ($rootScope.weighingHouse) conditions.push({weighingHouse: $rootScope.weighingHouse._id})
                    //conditions.push($scope.ngivrQuery.search);
                    // query.sort = {'updatedAt': -1}

                    if ($scope.product) {
                        conditions.push({
                            productName: {
                                $eq: $scope.product.name
                            }
                        });
                    }

                    if ($scope.tcn) {
                        conditions.push({
                            'ledger.tcn':
                            $scope.tcn._id
                        })
                    }

                    if ($scope.plateNumber) {
                        conditions.push({
                            'plateNumber1': {
                                $eq: $scope.plateNumber._id.plateNumber
                            }
                        })
                    }

                    if ($scope.partner) {
                        conditions.push({
                            $or: [
                                {
                                    "order.partner.name": {
                                        $eq: $scope.partner.name
                                    }
                                },
                                {
                                    "contract.partner.name": {
                                        $eq: $scope.partner.name
                                    }
                                },
                                {
                                    '$and': [
                                        {
                                            'ownerName': {$eq: $scope.partner.name}
                                        },
                                        // {
                                        //     $or: [{'ticketType': {$eq: 'changeOwner'}}, {'ticketType': {$eq: 'moveBetweenDepots'}}]
                                        // }
                                    ]
                                }
                            ]
                        });
                    }

                    if ($scope.from && moment($scope.from).isValid()) {
                        conditions.push({
                            fulfillmentDate: {
                                $gte: new Date($scope.from)
                            }
                        });
                    }

                    if ($scope.to && moment($scope.to).isValid()) {
                        let to = new Date($scope.to);
                        to.setDate(to.getDate() + 1);
                        conditions.push({
                            fulfillmentDate: {
                                $lte: to
                            }
                        });
                    }

                    if ($scope.direction && $scope.direction !== 'all') {
                        if ($scope.direction === 'in') {
                            conditions.push({
                                $or: [
                                    {direction: 'in'},
                                    {direction: 'internal_in'},
                                    {direction: 'external_in'},
                                ]
                            });
                        } else {
                            conditions.push({
                                $or: [
                                    {direction: 'out'},
                                    {direction: 'internal_out'},
                                    {direction: 'external_out'},
                                ]
                            });
                        }

                    }

                    if ($scope.owner && $scope.owner !== 'all') {
                        conditions.push({
                            sygnus: {
                                $eq: $scope.owner === 'sygnus'
                            }
                        });
                    }
                    if ($scope.site) {
                        conditions.push({
                            'site.siteId':
                            $scope.site._id

                        })
                    }
                    if ($scope.weighingHouse) {
                        conditions.push({
                            weighingHouse: $scope.weighingHouse._id
                        })
                    }

                    if ($scope.productGroup && $scope.productGroup._id !== 1) {
                        conditions.push({
                            'product.productGroupName': $scope.productGroup.name
                        })
                    }

                    if (conditions.length > 0) {
                        query.search = {$and: conditions};
                    } else {
                        query.search = $scope.ngivrQuery.search;
                    }
                }
            }


        }


    }
});
