'use strict';
ngivr.angular.directive('ngivrListInvoiceOutgoingRight', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            invoice: '='
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-invoice-outgoing-right.html',
        controller: class {

            constructor($scope, $state, Common) {
                this.$scope = $scope;
                $scope.selects = {
                    invoices: []
                };
                // ha torles van, akkor igy kell hasznalni (ures lesz minden)
                $scope.$on(ngivr.settings.event.client.list.clear, () => {
                    $scope.inputSearch = undefined;
                });

                $scope.getType = (type) => {
                    switch (type) {
                        case 'product':
                            return 'termény';
                            break;
                        case 'general':
                            return 'egyedi';
                            break;
                        case 'service':
                            return 'szolgáltatás';
                            break;
                        default:
                            return 'egyedi';
                            break
                    }
                };


            }
            search(query) {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {
                    "_id": {"$in":[]}
                };
                query.sort = {'updatedAt' : -1}
            }

            show() {
                alert('show');
            }

        }
    }
});
