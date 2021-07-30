'use strict';
ngivr.angular.directive('ngivrListInvoiceIncomingRight', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            invoice: '='
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-invoice-incoming-right.html',
        controller: class {

            constructor($scope, $state, Common) {
                this.$scope = $scope;

                // ha torles van, akkor igy kell hasznalni (ures lesz minden)
                $scope.$on(ngivr.settings.event.client.list.clear, () => {
                    $scope.inputSearch = undefined;
                });

                $scope.getType = (type) => {
                    switch (type) {
                        case 'product':
                            return 'T';
                            break;
                        case 'general':
                            return 'G';
                            break;
                        default:
                            return 'KSZ';
                            break
                    }
                };
            }
            search(query) {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {
                    $and: {
                        "_id": {"$in": []}
                    }
                };
                query.sort = {'updatedAt' : -1}
            }

            show() {
                alert('show');
            }

        }
    }
});
