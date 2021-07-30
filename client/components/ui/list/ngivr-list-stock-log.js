'use strict';
ngivr.angular.directive('ngivrListStockLog', ($window) => {
    return {
        restrict: 'E',
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-stock-log.html',
        scope: {
            ngivrQuery: '=',
            sygnus: '<?',
            direction: "<?",
            owner: '<?',
            userSite: '<?',
            showStockLogFields: '=?',
            showStockLogFields2: '=?'
        },
        transclude: true,
        controller: class {

            constructor($scope, socket, $mdMedia) {
                this.$scope = $scope;

                if ($scope.userSite) {
                    $scope.site = $scope.userSite
                }

                $scope.$mdMedia = $mdMedia;

                $scope.ngivrColumns = angular.copy(ngivr.strings.excel.stockLog.columns);
                $scope.ngivrHeaders = angular.copy(ngivr.strings.excel.stockLog.headers);

                // ha torles van, akkor igy kell hasznalni (ures lesz minden)
                $scope.$on(ngivr.settings.event.client.list.clear, () => {
                    $scope.textSearch = undefined;
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
                    $scope.orderNumber = undefined;
                    $scope.productGroup = {name: 'Összes', _id: 1};
                    if (!$scope.userSite) {
                        $scope.site = undefined
                    }
                });

                $scope.$watch('showStockLogFields', (newVal, oldVal) => {
                    // console.warn('showStockLogFields', newVal)
                    if (!newVal || !newVal.length) {
                        for (let i = 9; i <= 15; i++) {
                            $scope.ngivrColumns[i] = undefined;
                            $scope.ngivrHeaders[i] = undefined
                        }
                    } else {
                        for (let i = 9; i <= 15; i++) {
                            if (newVal.includes(ngivr.strings.excel.stockLog.headers[i])) {
                                $scope.ngivrColumns[i] = ngivr.strings.excel.stockLog.columns[i];
                                $scope.ngivrHeaders[i] = ngivr.strings.excel.stockLog.headers[i]
                            } else {
                                $scope.ngivrColumns[i] = undefined;
                                $scope.ngivrHeaders[i] = undefined
                            }
                        }
                    }
                    // console.warn('HEADERS',$scope.ngivrHeaders)
                });

                $scope.$watch('showStockLogFields2', (newVal, oldVal) => {
                    // console.warn('showStockLogFields', newVal)
                    if (!newVal || !newVal.length) {

                        $scope.ngivrColumns[19] = undefined;
                        $scope.ngivrHeaders[19] = undefined;
                        $scope.ngivrColumns[20] = undefined;
                        $scope.ngivrHeaders[20] = undefined;
                        $scope.ngivrColumns[24] = undefined;
                        $scope.ngivrHeaders[24] = undefined

                    } else {
                        for (let i = 19; i <= 20; i++) {
                            if (newVal.includes(ngivr.strings.excel.stockLog.headers[i])) {
                                $scope.ngivrColumns[i] = ngivr.strings.excel.stockLog.columns[i];
                                $scope.ngivrHeaders[i] = ngivr.strings.excel.stockLog.headers[i]
                            } else {
                                $scope.ngivrColumns[i] = undefined;
                                $scope.ngivrHeaders[i] = undefined
                            }

                        }
                        if (newVal.includes(ngivr.strings.excel.stockLog.headers[24])) {
                            $scope.ngivrColumns[24] = ngivr.strings.excel.stockLog.columns[24];
                            $scope.ngivrHeaders[24] = ngivr.strings.excel.stockLog.headers[24]
                        } else {
                            $scope.ngivrColumns[24] = undefined;
                            $scope.ngivrHeaders[24] = undefined
                        }
                    }
                    // console.warn('HEADERS',$scope.ngivrHeaders)
                });

                $scope.sort = {
                    position: 'before',
                    items: [
                        {
                            key: 'fulfillmentDate',
                            display: 'Teljesítés',
                            sort: 'fulfillmentDate'
                        }
                    ]
                };

                $scope.productGroup = {name: 'Összes', _id: 1};

                $scope.$watch('productGroup', (newVal, oldVal) => {
                    if ($scope.product && ($scope.product.productGroupName !== newVal.name && newVal.name !== 'Összes')) {
                        $scope.product = undefined
                    }
                }, true);


                // itt van a sticky scroll - START
                ngivr.stickyScroller({
                    scrollingContainerId: 'ngivr-portlet-stock-statement',
                    listHeaderId: 'ngivr-list-stock-log-header',
                    leftOffset: 5,
                    $scope: $scope
                });
                // itt van a sticky scroll - END

                const ticketListener = async () => {
                    this.search($scope.ngivrQuery);
                    ngivr.list.requery($scope, {force: true, query: $scope.ngivrQuery});

                };


                socket.socket.on('ticket:save', ticketListener);

                $scope.$on('$destroy', async () => {
                    socket.socket.removeListener('ticket:save', ticketListener);
                });


                $scope.$watchGroup(['from', 'to'], () => {
                    // console.log("Query was built");
                    this.search($scope.ngivrQuery);
                    ngivr.list.requery($scope);

                });


                this.sygnus = $scope.sygnus;
                this.direction = $scope.direction;
                this.filename = $scope.fileName || 'Keszlet_naplo.xlsx';
                this.$id = $scope.$id;
                this.topOffset = $window.innerWidth < 1000 ? 0 : 73;

                $scope.rows1 = [
                    {name: 'Tára súly'},
                    {name: 'Tára idő'},
                    {name: 'Bruttó súly'},
                    {name: 'Bruttó idő'},
                    {name: 'Zsákok száma'},
                    {name: 'Vontató'},
                    {name: 'Vontatmány'}
                ];

                $scope.rows2 = [
                    {name: 'Számlaszám'},
                    {name: 'Könyvelési azonosító'},
                    {name: 'Rögzítette'},

                ];

                $(document).ready(function () {
                    $(".ngivr-list-tickets-without-invoice").css({
                        'width': ($(".ngivr-list-header-column").width() + 'px')
                    });
                    $(".ngivr-list-tickets-without-invoice-divider").css({
                        'width': ($(".ngivr-list-header-column").width() + 'px')
                    });
                });
            }


            search(query) {
                const $scope = this.$scope;
                const s = $scope.textSearch;
                let conditions = [];

                let textSearch;
                if (s) {

                    textSearch = {
                        $or: [
                            {'productName': {$regex: s, $options: 'i'}},
                            {
                                'order.partner': {
                                    $elemMatch: {
                                        name: {
                                            $regex: s,
                                            $options: 'i'
                                        }
                                    }
                                }
                            },
                            {'order.name': {$regex: s, $options: 'i'}},
                            {'orderNumber': {$regex: s, $options: 'i'}},
                            {'contract.0.contractNumber': {$regex: s, $options: 'i'}},
                            {'contract.0.partnerContractNumber': {$regex: s, $options: 'i'}},
                            {'ticketName': {$regex: s, $options: 'i'}},
                            {'ledger.subTicketName': {$regex: s, $options: 'i'}}
                        ]
                    };
                    conditions.push(textSearch);
                }

                if ($scope.orderNumber) {
                    conditions.push({
                        'orderNumber': {
                            $eq: $scope.orderNumber
                        }
                    })
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

                if ($scope.tcn) {
                    conditions.push({
                        'ledger.tcn': {
                            $eq: $scope.tcn._id
                        }
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
                                    {
                                        $or: [{'ticketType': {$eq: 'changeOwner'}}, {'ticketType': {$eq: 'moveBetweenDepots'}}]
                                    }
                                ]
                            }
                        ]
                    });
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
                        'site.siteId': {
                            $eq: $scope.site._id
                        }
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

                conditions.push({"deleted": {$eq: false}});

                if ($scope.product) {
                    conditions.push({
                        productName: {
                            $eq: $scope.product.name
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
                //csak a nem törölt ticketek
                conditions.push({deleted: {$ne: true}});

                if (conditions.length > 0) {
                    query.search = {$and: conditions};
                } else {
                    query.search = {};
                }


            }

        }
    }
});
