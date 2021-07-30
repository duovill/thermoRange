'use strict';
ngivr.angular.directive('ngivrListGeneralInvoices', (ngivrLockList) => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            invoice: '='
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-general-invoices.html',
        controller: function ($scope, $state) {
            this.$scope = $scope;

            $scope.showDetails = $state.current.name === 'outgoing-invoices.product' && $scope.invoice.type === 'general';
            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                $scope.inputSearch = undefined;
            });

            $scope.$on(ngivr.settings.event.client.list.loaded, async (data) => {

                $scope.docs = data.targetScope.query.docs;

            });

            this.ngivrLockListInstance = ngivrLockList({
                scope: $scope,
                schema: 'outgoingInvoice',
                watch: 'docs',
                list: true,
                onUnlock: (options) => {
                },
                onAutoUnlockOrError: (options) => {
                    $scope.publish('unloadInvoice')
                }
            });

            $scope.getType = (type, relatedInvoice, origType) => {
                switch (type) {
                    case 'product':
                        return 'T';
                    case 'general':
                        return 'G';
                    case 'storno':
                        if (relatedInvoice.type === 'product') return 'T';
                        if (relatedInvoice.type === 'general') return 'G';
                        break;
                    case 'correction':
                        if (origType === 'product') return 'T';
                        if (origType === 'general') return 'G';

                }
            };

            $scope.subscribe('unlockInvoice', async (invoice) => {
                await this.ngivrLockListInstance.unlockDocument({doc: invoice});
                $scope.lockedId = undefined
            });

            $scope.isDisabledButtons = (doc) => {
                return this.ngivrLockListInstance.isDocumentLocked({doc: doc})
            };

            $scope.informUser = () => {
                ngivr.growl(`A számla már be van töltve.`, 'info')
            };

            this.search = (query) => {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {
                    type: 'general'
                };
                query.sort = {'updatedAt': -1}
            };

            this.show = () => {
                alert('show');
            };

            this.addDepositToInvoice = (depositInvoice) => {
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
                for (let i in $scope.invoice.summaryPerProduct) {

                    $scope.invoice.sum += $scope.invoice.summaryPerProduct[i].totalPrice - (!isNaN($scope.invoice.summaryPerProduct[i].discountValue) ? $scope.invoice.summaryPerProduct[i].discountValue : 0);
                    $scope.invoice.vatBase += $scope.invoice.summaryPerProduct[i].totalPrice - (!isNaN($scope.invoice.summaryPerProduct[i].discountValue) ? $scope.invoice.summaryPerProduct[i].discountValue : 0);
                }
                $scope.invoice.vatValue = isNaN($scope.invoice.vat) ? 0 : $scope.invoice.vatBase * $scope.invoice.vat / 100;
                $scope.invoice.endSum = $scope.invoice.sum + $scope.invoice.vatValue;


                $scope.invoice.items.push({  //tételes lista
                    product: depositInvoice.items[0].product[0],
                    amount: depositInvoice.items[0].amount,
                    pricePerUnit: -depositInvoice.sumToInvoice,
                    totalPrice: -depositInvoice.sumToInvoice,

                });


            };

            /**
             * Számla visszatöltése a formba
             * @param invoice
             */
            this.loadInvoice = (invoice) => {
                this.$scope.publish('loadInvoice', invoice)

            };

            /**
             * Számla storno
             */
            this.startStorno = async (doc, $event) => {
                if ($event !== undefined) {
                    $event.stopImmediatePropagation();
                }
                if (await this.ngivrLockListInstance.isDocumentLockedByMe({doc: doc})) {
                    $scope.informUser();
                    return
                }
                if ($scope.lockedId) {
                    await this.ngivrLockListInstance.unlockDocument({doc: {_id: $scope.lockedId}});
                }
                await this.ngivrLockListInstance.lockDocument({doc: doc});
                $scope.lockedId = doc._id;
                this.$scope.publish('loadInvoiceToStorno', doc, $event)
            };

            /**
             * Számla helyesbítése
             */
            this.startCorrection = async (doc, $event) => {
                if ($event !== undefined) {
                    $event.stopImmediatePropagation();
                }
                if (await this.ngivrLockListInstance.isDocumentLockedByMe({doc: doc})) {
                    $scope.informUser();
                    return
                }
                if ($scope.lockedId) {
                    await this.ngivrLockListInstance.unlockDocument({doc: {_id: $scope.lockedId}});
                }
                await this.ngivrLockListInstance.lockDocument({doc: doc});
                $scope.lockedId = doc._id;
                this.$scope.publish('loadInvoiceToCorrection', doc, $event)
            };
        }
    }
});
