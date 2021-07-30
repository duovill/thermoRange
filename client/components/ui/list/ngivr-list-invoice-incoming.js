'use strict';
ngivr.angular.directive('ngivrListInvoiceIncoming', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            invoice: '='
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-invoice-incoming.html',
        controller: class {

            constructor($scope, $state, Common) {
                this.$scope = $scope;
                $scope.isSelectedAll = false;
                $scope.currentPage = 1;
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
                    $scope.publish('selectInvoiceIncoming', $scope.selects);
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
                    $scope.publish('selectInvoiceIncoming', $scope.selects);
                };

                $scope.selectAllInvoice = function (isSelectedAll, invoices, currentPage) {
                    console.log(currentPage);
                    if ( isSelectedAll)
                        $scope.selectAll(invoices);
                    else
                        $scope.deSelectAll(invoices);
                };

                $scope.selectAll = function (invoices) {
                    invoices.forEach(function (invoice) {
                        $scope.selects.invoices.push({id: invoice._id, selectable: true});
                        $scope.selects.ids.push(invoice._id);
                    });
                    $scope.publish('selectInvoiceIncoming', $scope.selects);
                };
                $scope.deSelectAll = function (invoices) {
                    invoices.forEach(function (invoice) {
                        const selectedTicketsIdx = Common.functiontofindIndexByKeyValue($scope.selects.invoices, 'id', invoice._id);
                        $scope.selects.invoices.splice(selectedTicketsIdx, 1);
                    });
                    $scope.selects.ids = [];
                    $scope.publish('selectInvoiceIncoming', $scope.selects);
                };

            }
            search(query) {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {
                    type: 'general'
                };
                query.sort = {'updatedAt' : -1}
            }

            show() {
                alert('show');
            }

            addDepositToInvoice  (depositInvoice)  {
                const $scope = this.$scope;

                $scope.invoice.summaryPerProduct.push({  //termékenkénti összesítő
                    product: depositInvoice.items[0].product[0],
                    amount: depositInvoice.items[0].amount,
                    pricePerUnit: -depositInvoice.sumToInvoice,
                    totalPrice: -depositInvoice.sumToInvoice,
                    vat: depositInvoice.vat
                    //fulfillmentDate: ticket.fulfillmentDate,
                    //discountValue: isNaN(ticket.discountValue) ? 0 : ticket.discountValue

                });

                $scope.invoice.vat = depositInvoice.vat;
                $scope.invoice.sum = 0;
                $scope.invoice.vatBase = 0;
                for (var i in $scope.invoice.summaryPerProduct) {

                    $scope.invoice.sum += $scope.invoice.summaryPerProduct[i].totalPrice - (!isNaN($scope.invoice.summaryPerProduct[i].discountValue) ? $scope.invoice.summaryPerProduct[i].discountValue : 0);
                    $scope.invoice.vatBase += $scope.invoice.summaryPerProduct[i].totalPrice - (!isNaN($scope.invoice.summaryPerProduct[i].discountValue) ? $scope.invoice.summaryPerProduct[i].discountValue : 0);
                }
                $scope.invoice.vatValue = isNaN($scope.invoice.vat) ? 0 : $scope.invoice.vatBase * $scope.invoice.vat / 100;
                $scope.invoice.endSum = $scope.invoice.sum + $scope.invoice.vatValue;



                $scope.invoice.items.push({  //tételes lista
                    product: depositInvoice.items[0].product[0],
                    amount:  depositInvoice.items[0].amount,
                    pricePerUnit: -depositInvoice.sumToInvoice,
                    totalPrice: -depositInvoice.sumToInvoice,

                });


            }

            /**
             * Számla visszatöltése a formba
             * @param invoice
             */
            loadInvoice  (invoice)  {
                this.$scope.publish('loadInvoice', invoice)

            }

        }
    }
});
