'use strict';
ngivr.angular.directive('ngivrListTicketGeneratorShips', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-ticket-generator-ships.html',
        controller: function ($scope, ngivrPopupShip) {
            this.$scope = $scope;

            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                $scope.inputSearch = undefined;
            });
            $scope.loadShip = function (ship, $event) {
                ngivrPopupShip.show({
                    ship: ship,
                    $event: $event,
                    $parentScope: $scope
                })
                //$scope.publish('loadShip', ship);
            };

            this.search = (query) => {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {

                    $or: [
                        {
                            'partner.name': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'name': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'quayBerth': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'cargoPlanName': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        }
                    ],
                    deleted: false


                };
                query.sort = {'updatedAt': -1}
            }
        }


    }
});
