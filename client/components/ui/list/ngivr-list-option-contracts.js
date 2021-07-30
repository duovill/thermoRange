'use strict';
ngivr.angular.directive('ngivrListOptionContracts', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '='
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-option-contracts.html',
        controller: class {

            constructor($scope) {
                this.$scope = $scope;

                // ha torles van, akkor igy kell hasznalni (ures lesz minden)
                $scope.$on(ngivr.settings.event.client.list.clear, () => {
                    $scope.inputSearch = undefined;
                });

            }
            search(query) {
                const $scope = this.$scope;
                const search = $scope.inputSearch;

                query.search = {
                    $or: [
                        {
                            'rate': isNaN(search) ? '' : search
                        },
                        {
                            'direction': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },

                    ]
                };
            }
        }
    }
});
