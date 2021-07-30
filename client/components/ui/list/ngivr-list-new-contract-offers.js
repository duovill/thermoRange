'use strict';
ngivr.angular.directive('ngivrListNewContractOffers', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            timeOfSubmit: '&'
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-new-contract-offers.html',
        controller: function ($scope, $state) {
            this.$scope = $scope;

            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            ngivr.event.on.list.clear($scope, () => {
                $scope.inputSearch = undefined;
            });

            $scope.goToDetails = (doc) => {
                // $scope.publish('offerLoaded', doc)
                $state.go('newContract.offerDetails', {id: doc._id, offer: doc})
            };

            this.search = (query) => {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {
                    offer: true,
                    deletedOffer: false,
                    returned: false,
                    submitted: true,
                    buy: $scope.ngivrQuery.search.buy,
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
                        }
                    ]
                };
                //query.sort = {'updatedAt' : -1}
            };

            this.show = () => {
                alert('show');
            }
        }

    }
});
