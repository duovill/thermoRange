'use strict';
ngivr.angular.directive('ngivrListMovementsBetweenPartners', () => {
    return {
        restrict: 'E',
        scope: {
            //ngivrQuery: '=',
            ticketSelected: '=',
            showFilter: '<'
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-movements-between-partners.html',
        controller: function ($scope) {
            this.$scope = $scope;
            $scope.ngivrQuery = {sort: {fulfillmentDate: -1}};
            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                $scope.inputSearch = undefined;

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

            this.search = (query) => {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                let conditions = [];
                let inputSearch;
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
                                'owners.name': {
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
                                'depot.0.site.name': {
                                    '$regex': search,
                                    '$options': 'i'
                                }
                            },
                        ]
                    };
                    conditions.push(inputSearch)
                }

                if (conditions.length > 0) {
                    query.search = {$and: conditions};
                } else {
                    query.search = $scope.ngivrQuery.search;
                }
            }


        }
    }
});
