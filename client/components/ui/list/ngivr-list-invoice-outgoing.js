'use strict';
ngivr.angular.directive('ngivrListInvoiceOutgoing', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            invoice: '='
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-invoice-outgoing.html',
        controller: class {

            constructor($scope, $state, Common) {
                this.$scope = $scope;
                $scope.selects = {
                    invoices: [],
                    ids: []
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
                /**
                 * Adott számla kiválasztásának ellenőrzése
                 * @param id
                 * @returns {boolean}
                 */
                $scope.isSelected = (id) => {
                    for (let i in $scope.selects.invoices) {
                        if ($scope.selects.invoices[i].id === id) {
                            return true;
                        }
                    }
                    return false;
                };

                $scope.selectInvoice = function (invoice) {
                    $scope.selects.invoices.push({id: invoice._id, selectable: true});
                    $scope.selects.ids.push(invoice._id);
                    $scope.publish('selectInvoiceOutgoing', $scope.selects);
                };

                /**
                 * Számla kiválasztásának törlése
                 * @param invoice
                 */
                $scope.deselectInvoice = function (invoice) {
                    const selectedTicketsIdx = Common.functiontofindIndexByKeyValue($scope.selects.invoices, 'id', invoice._id);
                    $scope.selects.invoices.splice(selectedTicketsIdx, 1);
                    let  deselectedInvoiceIdIndex = $scope.selects.ids.indexOf(invoice._id);
                    $scope.selects.ids.splice(deselectedInvoiceIdIndex, 1);
                    $scope.publish('selectInvoiceOutgoing', $scope.selects);
                };

            }
            search(query) {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {
                };
                query.sort = {'updatedAt' : -1}
            }

            show() {
                alert('show');
            }

        }
    }
});
