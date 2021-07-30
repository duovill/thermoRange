'use strict';
ngivr.angular.directive('ngivrListContracts', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '='
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-contracts.html',
        controller: function ($scope) {
            this.$scope = $scope;

            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                $scope.inputSearch = undefined;
            });
            this.filename = `${$scope.ngivrQuery.search.buy ? 'Vételi' : 'Eladási'} szerződések.xlsx`
            this.search =(query) => {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                //console.log($scope.ngivrQuery.search.buy)
                query.search = {
                    contract: true,
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
            }
        }
    }
});
