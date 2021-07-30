'use strict';
ngivr.angular.directive('ngivrListShipTicket', ($http, $filter, socket, ngivrService, $timeout, ngivrEkaer, ngivrSocketLock, Auth, ngivrGrowl, Common, ngivrPrompt, ngivrConfirm, ngivrApi, ngivrTicketValidation, $window, ngivrLockService) => {
    // let vehicleIndex = 0;
    return {
        restrict: 'E',
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-ship-ticket.html',
        scope: {
            ngivrQuery: '=',
            ngivrUrl: '=',
            wrongEkaer: '<',
            shipId: "<"
        },
        transclude: true,
        controller: class {

            constructor($scope) {

                //const start = async () => {

                // vehicleIndex++;
                // const thisVehicleIndex = vehicleIndex;

                this.$scope = $scope;
                $scope.shipId = $scope.$parent.shipId;
                $scope.fileName = $scope.$parent.shipName;

                $scope.$on(ngivr.settings.event.client.list.clear, () => {
                    $scope.inputSearch = undefined;

                });

                this.$id = $scope.$id;
                this.topOffset = $window.innerWidth < 1000 ? 0 : 73;

                $scope.$on(ngivr.settings.event.client.list.loaded, async (data) => {
                    //this.getPerformedAndTransportDiff(data.targetScope.query.docs);
                    //$scope.docs = data.targetScope.query.docs;
                    //  $scope.setSubscribers();
                    //for (let doc of data.targetScope.query.docs) {
                    // let resp = await ngivrApi.query('ticket', {search: {ledger: {$elemMatch: {subTicketName: doc.outTicket || doc.inTicket}}}});
                    // doc.shipName = resp.data.docs[0].ship.name;
                    // if (resp.data.docs[0].hasOwnProperty('parentTicketId')) {
                    //     resp = await ngivrApi.id('ticket', resp.data.docs[0].parentTicketId);
                    //     doc.inTicketNumber = resp.data.doc.ticketName;
                    //     doc.relatedOrderNumber = resp.data.doc.ledger[0].orderNumber
                    // }

                    // if (doc.loadedWeight) {
                    //     doc.loadedWeight = Number(doc.loadedWeight.toFixed(3));
                    // }
                    // if (doc.unloadedWeight) {
                    //     doc.unloadedWeight = Number(doc.unloadedWeight.toFixed(3));
                    // }

                    //}
                });


                $scope.locklist = [];

                //$scope.socketService = ngivrSocketLock;
                $scope.selected = [];
                $scope.ekaer = {
                    edited: false,
                    request: false
                };


                $scope.isDisabled = {
                    ekaer: (dispo) => {
                        return dispo.orderClosed || dispo.deleted || !$scope.ekaer.edited
                    },

                    addVehicle: (dispo) => {
                        return dispo.ekaer ? !$scope.ekaer.edited || dispo.orderClosed || dispo.deleted : dispo.orderClosed || dispo.deleted
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
                            'orderNumber': {
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
                            'plateNumber2': {
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


            ticketBackground(doc) {
                return (doc.inTicket || doc.outTicket) ? (doc.unloadedWeight ? 'green-plane' : 'yellow-plane') : 'grey-plane';
            }


        }
    }
});
