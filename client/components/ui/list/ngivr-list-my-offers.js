'use strict';
ngivr.angular.directive('ngivrListMyOffers', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '='
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-my-offers.html',
        controller: function ($scope, Auth) {
            this.$scope = $scope;
            $scope.currentUser = Auth.getCurrentUser();
            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                $scope.inputSearch = undefined;
            });

            this.search = (query) => {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {
                    offer: true,
                    deletedOffer: false,
                    buy: $scope.ngivrQuery.search.buy,
                    'owner.0.name': $scope.currentUser.name,
                    $or: [
                        {
                            'partner.name': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'contractNumber': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'partnerContractNumber': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'product.0.name': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        }
                    ]
                };
            }
        }
    }
});
