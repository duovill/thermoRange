'use strict';
ngivr.angular.directive('ngivrListItkDepots', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            productsSum: '=',
            depots: '=',
            selectedItkProduct: '=',
            ngivrUrl: '<'
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-itk-depots.html',
        controller: class {

            constructor($scope) {
                this.$scope = $scope;

                this.$scope.selectDepot = (depot) => {
                    console.log(depot);
                    this.$scope.selectedDepot = depot;
                };
                this.$scope.deSelectDepot = () => {
                    this.$scope.selectedDepot = null;
                };
                $scope.$on(ngivr.settings.event.client.list.clear, () => {
                    $scope.inputSearch = undefined;
                    $scope.selectedItkProduct = undefined
                });

            }

            search(query) {
                console.log(query);
                //const $scope = this.$scope;
            }

            loadDepot(depot) {
                this.$scope.publish('loadDepot', depot)
            }

        }
    }
});
