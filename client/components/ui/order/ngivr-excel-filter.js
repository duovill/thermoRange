/* jshint undef: true, unused: true, esversion: 6*/
/* global ngivr,async*/


'use strict';
ngivr.angular.directive('ngivrOrderExcelFilter', () => {
    //const service = ngivrService;
    return {
        templateUrl: "components/ui/order/ngivr-excel-filter.html",
        restrict: 'E',
        scope: {
            prodType: '<?',
            xq: "=",
            query: "=?",
            hideFields: "<?",
            hideButton: "<?",
            hideDateFilter: "<?"

        },
        link: function (scope, elm, attrs, $ctrl) {
            scope.ngivrTooltipDirection = attrs.ngivrTooltipDirection || 'top';
            scope.ngivrTooltip = attrs.ngivrTooltip || 'Export to excel';
            scope.fileName = "Tárolási lista";
            scope.listQuery = scope.listQuery || {};
        },
        controller: ($scope) => {
            $scope.filter = {isClosed: 'notClosed', status: 'all'};
            /**
             * Ha popupban vagyunk, itt állítjuk be a query-t,
             * és hogy minden order benne legyen
             */
            if (!$scope.query) {
                $scope.query = {
                    $and: [
                        {visible: true},
                        {'partner.0.name': undefined},
                        {'orderProductName': undefined},
                        {'orderProduct.productGroupName': undefined}

                    ]
                };
                $scope.filter.isClosed = 'all'
            }
            $scope.origQuery = angular.copy($scope.query);
            $scope.listQuery = $scope.listQuery || {};

            $scope.buildListQuery = async () => {
                $scope.listQuery.from = $scope.filter.from;
                $scope.listQuery.to = $scope.filter.to;
                $scope.listQuery.partner = $scope.filter.partner ? $scope.filter.partner._id : undefined;
                $scope.listQuery.site = $scope.filter.site ? $scope.filter.site._id : undefined;
                $scope.listQuery.prodType = $scope.filter.prodType;
                $scope.listQuery.product = $scope.filter.product ? $scope.filter.product._id : undefined;
                $scope.listQuery.textSearch = $scope.filter.textSearch;
                $scope.listQuery.status = $scope.filter.status;
                $scope.listQuery.isClosed = $scope.filter.isClosed;
                $scope.status = 'all';
                console.log($scope.listQuery);
                $scope.publish('listQueryChanged', $scope.listQuery)
            };
            $scope.buildListQuery();

            $scope.buildQuery = async () => {
                let conditions = angular.copy($scope.origQuery.$and);
                if (!$scope.prodType || $scope.prodType === "grain") {
                    conditions.push({
                        "fertilizer": {
                            $eq: false
                        }
                    });
                } else {
                    conditions.push({
                        "fertilizer": {
                            $eq: true
                        }
                    });
                }
                let textSearch;
                if ($scope.filter.textSearch) {
                    let s = $scope.filter.textSearch;
                    textSearch = {
                        $or: [
                            {'orderProductName': {$regex: s, $options: 'i'}},
                            {
                                'partner': {
                                    $elemMatch: {
                                        name: {
                                            $regex: s,
                                            $options: 'i'
                                        }
                                    }
                                }
                            },
                            {'name': {$regex: s, $options: 'i'}},
                            {'orderNumber': {$regex: s, $options: 'i'}},
                            {
                                'loadLocation': {
                                    $elemMatch: {
                                        name: {
                                            $regex: s,
                                            $options: 'i'
                                        }
                                    }
                                }
                            },
                            {
                                'unloadLocation': {
                                    $elemMatch: {
                                        name: {
                                            $regex: s,
                                            $options: 'i'
                                        }
                                    }
                                }
                            },
                            {
                                'loadLocationSettlement': {
                                    $elemMatch: {
                                        name: {
                                            $regex: s,
                                            $options: 'i'
                                        }
                                    }
                                }
                            },

                        ]
                    };
                    conditions.push(textSearch);
                }

                if ($scope.filter.partner) {
                    conditions.push({
                        "partner.name": {
                            $eq: $scope.filter.partner.name
                        }
                    });
                }
                if ($scope.filter.site) {
                    conditions.push({
                        $or: [{
                            'unloadLocation._id':
                            $scope.filter.site._id

                        }, {
                            'loadLocation._id':
                            $scope.filter.site._id

                        }]
                    });
                }
                if ($scope.filter.product) {
                    conditions.push(
                        {
                            $or: [
                                {orderProductName: {$eq: $scope.filter.product.name}},
                                {'orderProduct.name': {$eq: $scope.filter.product.name}}
                            ]
                        })
                }
                if ($scope.filter.status && $scope.filter.status !== 'all') {
                    conditions.push({
                        finalized: {$eq: $scope.filter.status === 'finalized'}
                    })
                }

                if ($scope.filter.isClosed && $scope.filter.isClosed !== 'all') {
                    // conditions.push({
                    //     orderClosed: {$eq: $scope.filter.isClosed === 'closed'}
                    // })
                    conditions[4] = {orderClosed:{$eq: $scope.filter.isClosed === 'closed'}}

                }

                if ($scope.filter.isClosed && $scope.filter.isClosed === 'all') {
                    // conditions.push({
                    //     orderClosed: {$eq: $scope.filter.isClosed === 'closed'}
                    // })
                    conditions[4] = {}

                }

                if (conditions.length > 0) {
                    $scope.query = {$and: conditions};
                } else {
                    $scope.query = {}
                }

            };


            // a parent direktíva kezdeményezte a filter törlését
            $scope.$on('clearFilter', () => {
                $scope.from = undefined;
                $scope.to = undefined;
                $scope.partner = undefined;
                $scope.site = undefined;
                $scope.product = undefined;
                $scope.textSearch = undefined;
                $scope.status = 'all';
                $scope.filter = {
                    from: undefined,
                    to: undefined,
                    partner: undefined,
                    site: undefined,
                    producr: undefined,
                    textSearch: undefined,
                    status: 'all',
                    isClosed: 'notClosed'
                }
            });

            $scope.buildQuery();

            $scope.$watchGroup(['from', 'to', 'site', 'partner', 'product', 'status'], () => {
                console.log("Query was built");
                $scope.buildQuery();
                if ($scope.xq) {
                    $scope.xq($scope.query);
                }

            });

            $scope.$watch('filter', () => {
                console.log("Query was built");
                $scope.buildQuery();
                if ($scope.xq) {
                    $scope.xq($scope.query);
                }
            }, true);

            $scope.search = () => {
                $scope.buildQuery();
                if ($scope.xq) {
                    $scope.xq($scope.query);
                }

            };

            $scope.subscribe('downloadList', () => {
                $scope.buildQuery();
            });

            $scope.subscribe('triggerBuildListQuery', () => {
                $scope.buildListQuery();

            })

            //$scope.partner = undefined
        },

    }
});
