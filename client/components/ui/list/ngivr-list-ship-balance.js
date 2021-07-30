'use strict';
ngivr.angular.directive('ngivrListShipBalance', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            shipId : '=',
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-ship-balance.html',
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
                    shipId: shipId
                };
                query.sort = {'updatedAt' : -1}
            }

            show() {
                alert('show');
            }


        }
    }
});
