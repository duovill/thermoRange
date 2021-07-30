'use strict';
ngivr.angular.directive('ngivrSelectDeposit', function (ngivrService, ngivrInput, $filter, ngivrGrowl) {

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            buyerId: '=',
            sellerId: '=',
            item: '=',
            currency: '=',
            items: '=',
            fulfillmentDate: '=',
            setgeneralInvoiceSummaryRow: '&',
            calculate: '&?',
            setRate: '&',
            orig: "=",
            depositsInItems: "=?",
            ledgerHelper: '<'
        },
        template: `
<md-select class="ngivr-select"  ng-model="model" ng-model-options="{ trackBy: '$value._id'}" md-on-close="setItem()">
  <md-option ng-repeat="deposit in deposits | filter: depositFilter" ng-value="deposit" ng-disabled="disabledField">
    {{ deposit.number + (deposit.amount ? ' (' + (deposit.amount | currency: deposit.currency) + ')' : '')}}
  </md-option>
</md-select>
`,
        link: function (scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);

            scope.$watchGroup(['sellerId', 'currency'], () => {
                dataQuery.query({
                    search: {
                        partnerId: scope.buyerId || scope.sellerId,
                        paid: true,
                        depositInvoice: null,
                        direction: scope.buyerId ? 'in' : 'out',
                        currency: scope.currency
                    },
                    limit: 0
                });
            });

            const dataQuery = ngivrService.data.query({
                $scope: scope,
                schema: 'deposit',
                subscribe: async (promise) => {
                    try {
                        const response = await promise;
                        const data = Object.assign({}, response.data);
                        scope.deposits = data.docs;
                        if (!scope.deposits.length) {
                            scope.deposits = [{number: 'Nincs választható előlegbekérő'}];
                            scope.disabledField = true
                        } else {
                            scope.disabledField = false
                        }

                    } catch (e) {
                        ngivr.growl.error(e);
                    }
                }
            });

            dataQuery.query({
                search: {
                    partnerId: scope.buyerId || scope.sellerId,
                    paid: true,
                    depositInvoice: null,
                    direction: scope.buyerId ? 'in' : 'out',
                    currency: scope.currency
                },
                limit: 0
            });

            scope.depositFilter = (item) => {
                if (!scope.depositsInItems) {
                    return true
                }
                let idx = scope.depositsInItems.findIndex((el) => {
                    return item._id === el.id
                });
                return idx === -1
            };

            scope.setItem = () => {
                if (scope.model !== undefined) {
                    if (!scope.ledgerHelper) {
                        ngivrGrowl('Mozgásnem nincs kiválasztva, nem adható tétel a számlához!')
                        scope.model = undefined;
                        return
                    }
                    if (scope.sellerId) { //bejövő számla esetén
                        scope.orig.items = angular.copy(scope.items)
                    }
                    if (scope.depositsInItems) {
                        scope.depositsInItems.push({id: scope.model._id});
                    }

                    scope.item.unit = 'db';
                    scope.item.amount = 1;
                    scope.item.pricePerUnit = scope.model.amount;
                    //scope.currency = scope.model.currency;
                    scope.fulfillmentDate = $filter('date')(scope.model.payDate, 'yyyy.MM.dd');
                    if (scope.items.length) {
                        scope.items[0] = {
                            product: scope.item.product,
                            amount: 1,
                            pricePerUnit: scope.model.amount,
                            totalPrice: Math.round(scope.model.amount),
                            fulfillmentDate: scope.model.payDate,
                            currency: scope.model.currency,
                            //ticketId: null,
                            discountType: 'none',
                            discountValue: 0,
                            //plateNumber1: null,
                            //plateNumber2: null,
                            comment: (scope.items[0].comment ? scope.items[0].comment + ' ' : '') + scope.model.number + ' számú előlegbekérő alapján.',
                            deposit: scope.item.deposit,
                            // depositId: $scope.invoiceitems[index].deposit ? $scope.invoiceitems[index].deposit._id : undefined,
                            origVat: scope.item.product ? scope.item.product.vat : undefined,
                            unit: 'db',
                            depositId: scope.model._id
                        }
                    } else {
                        scope.items.push({
                            product: scope.item.product,
                            amount: 1,
                            pricePerUnit: scope.model.amount,
                            totalPrice: Math.round(scope.model.amount),
                            fulfillmentDate: scope.model.payDate,
                            currency: scope.model.currency,
                            //ticketId: null,
                            discountType: 'none',
                            discountValue: 0,
                            //plateNumber1: null,
                            //plateNumber2: null,
                            comment: scope.model.number + ' számú előlegbekérő alapján.',
                            deposit: scope.item.deposit,
                            // depositId: $scope.invoiceitems[index].deposit ? $scope.invoiceitems[index].deposit._id : undefined,
                            origVat: scope.item.product ? scope.item.product.vat : undefined,
                            unit: 'db',
                            depositId: scope.model._id
                        })
                    }

                    scope.items[0].validitem = true;
                    if (scope.buyerId) { //kimenő számla esetén
                        scope.setgeneralInvoiceSummaryRow();
                    }
                    if (scope.sellerId) { //bejövő számla esetén
                        scope.items[0].vat = scope.item.product ? scope.item.product.vat : undefined,
                            scope.calculate({item: scope.items[0]})
                        //scope.items[0].comment = (scope.items[0].comment ? scope.items[0].comment + ' ' : '') + scope.model.number + ' számú előlegbekérő alapján.'
                    }

                }
            }
        },
    }
});
