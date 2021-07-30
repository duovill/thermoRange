'use strict';
ngivr.angular.directive('ngivrListTicketsPerDepots', ($window) => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            owner: '<',
            userSite: '<'
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-tickets-per-depots.html',
        controller: class {

            constructor($scope) {
                this.$scope = $scope;

                $scope.sort = {
                    position: 'before',
                    items: [
                        {
                            key: 'fulfillment',
                            display: 'Dátum',
                            sort: {

                                // ez mindig statikus, soha nem változik
                                //createdAt: -1,
                                // ebben a gui dönt
                                'fulfillmentDate': true,
                                // ebben a gui dönt
                                'ticketName': true,
                            },

                        }
                    ]
                };

                $scope.$on(ngivr.settings.event.client.list.clear, () => {
                    $scope.textSearch = undefined;
                    $scope.product = undefined;
                    $scope.owner = 'all';
                    $scope.from = undefined;
                    $scope.to = undefined;
                    $scope.tcn = undefined;
                    $scope.partner = undefined;
                    $scope.sygnus = true;
                    $scope.depot = undefined

                });

                $scope.$watchGroup(['from', 'to'], () => {
                    // console.log("Query was built");
                    this.search($scope.ngivrQuery);
                    ngivr.list.requery($scope);

                });
                this.filename = 'Tárolási lista.xlsx';
                this.$id = $scope.$id;
                this.topOffset = $window.innerWidth < 1000 ? 0 : 73;

            }

            search(query) {
                const $scope = this.$scope;
                const s = $scope.textSearch;
                let conditions = [];

                // let textSearch;
                // if (s) {
                //
                //     textSearch = {
                //         $or: [
                //             {'productName': {$regex: s, $options: 'i'}},
                //             {
                //                 'order.partner': {
                //                     $elemMatch: {
                //                         name: {
                //                             $regex: s,
                //                             $options: 'i'
                //                         }
                //                     }
                //                 }
                //             },
                //             {'order.name': {$regex: s, $options: 'i'}},
                //             {'orderNumber': {$regex: s, $options: 'i'}},
                //
                //         ]
                //     };
                //     conditions.push(textSearch);
                // }

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

                if ($scope.tcn) {
                    conditions.push({
                        'tcn': {
                            $eq: $scope.tcn._id
                        }
                    })
                }


                if ($scope.partner) {
                    conditions.push({
                        ownerName: {$eq: $scope.partner.name}
                    });
                }

                if ($scope.owner && $scope.owner !== 'all') {
                    conditions.push({
                        sygnus: {
                            $eq: $scope.owner === 'sygnus'
                        }
                    });
                }

                if ($scope.depot) {
                    conditions.push({
                        depotName: {$eq: $scope.depot.name}
                    })
                }

                // if ($scope.sygnus) {
                //   conditions.push({
                //     "sygnus": {
                //       $eq: true
                //     }
                //   });
                // } else {
                //   conditions.push({
                //     "sygnus": {
                //       $eq: false
                //     }
                //   });
                // }

                //conditions.push({"deleted": {$eq: false}});
                if ($scope.ticketName) {
                    conditions.push({
                        ticketName: {
                            $regex: $scope.ticketName, $options: 'i'
                        }
                    });
                }

                if ($scope.product) {
                    conditions.push({
                        productName: {
                            $eq: $scope.product.name
                        }
                    });
                }

                if ($scope.direction && $scope.direction !== 'all') {
                    conditions.push({
                        direction: {
                            $eq: $scope.direction
                        }
                    });
                }
                //csak a nem törölt ticketek
                // conditions.push({deleted: {$ne: true}});
                if ($scope.userSite) {
                    conditions.push({siteId: $scope.userSite._id})
                }

                if (conditions.length > 0) {
                    query.search = {$and: conditions};
                } else {
                    query.search = {};
                }


            }
        }
    }
});
