'use strict';
ngivr.angular.directive('ngivrListTicketGeneratorOrders', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            loadFromDispo: '=',
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-ticket-generator-orders.html',
        controller: function ($scope, $rootScope) {
            this.$scope = $scope;

            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                $scope.inputSearch = undefined;
            });

            this.search = (query) => {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {
                    $and: [

                        {finalized: true},
                        {deleted: false},
                        {
                            $or: [
                                {'loadLocation._id': $rootScope.weighingHouse.site._id},
                                {'unloadLocation._id': $rootScope.weighingHouse.site._id},
                            ]
                        },
                        {
                            $or: [
                                {
                                    'partner.name': {
                                        '$regex': search,
                                        '$options': 'i'
                                    }
                                },
                                {
                                    'loadLocation.name': {
                                        '$regex': search,
                                        '$options': 'i'
                                    }
                                },
                                {
                                    'unloadLocation.name': {
                                        '$regex': search,
                                        '$options': 'i'
                                    }
                                },
                                {
                                    'loadLocationSettlement.name': {
                                        '$regex': search,
                                        '$options': 'i'
                                    }
                                }
                            ]
                        }
                    ]
                };
                //query.sort = {'updatedAt' : -1}
            }
        }


    }
});
