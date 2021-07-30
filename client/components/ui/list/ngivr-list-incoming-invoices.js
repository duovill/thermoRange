'use strict';
ngivr.angular.directive('ngivrListIncomingInvoices', (ngivrLockList) => {
    return {
        restrict: 'E',
        scope: true,
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-incoming-invoices.html',
        controller: class {

            constructor($scope, ngivrApi, ngivrGrowl, $stateParams, ngivrService, ngivrPopupIncomingInvoice) {
                $scope.ngivr = ngivrService;

                this.$scope = $scope;

                $scope.$on(ngivr.settings.event.client.list.loaded, async (data) => {

                    $scope.docs = data.targetScope.query.docs;

                });

                if ($stateParams.data) {
                    $scope.ngivrQuery = $stateParams.data.query;
                    $scope.item = $stateParams.data.item;
                }
                if ($stateParams.item) {
                    $scope.typeList = $stateParams.item.typeList;
                    $scope.registryStatusList = $stateParams.item.registryStatusList;
                    $scope.payModeList = $stateParams.item.payModeList;
                    $scope.incomingTypesList = $stateParams.item.incomingTypesList
                }

                /**
                 * Törli a kerersőmezőt
                 */
                $scope.$on(ngivr.settings.event.client.list.clear, () => {
                    $scope.inputSearch = undefined;
                });


                /**
                 * Ticket, illetve order választhatóságának ellenőrzése
                 * @param id
                 * @returns {boolean}
                 */
                $scope.isLocked = (id) => {
                    try {
                        for (let i in $scope.locklist) {
                            if (id === $scope.locklist[i].data.model._id) {
                                return true
                            }
                        }
                    }
                    catch (err) {
                        return false
                    }
                    return false
                };

                /**
                 * Számla részletes nézet ki-, bekapcsolása
                 * @param tabType
                 * @param subTabType
                 * @param invoice
                 * @param idx
                 * @param $event
                 */
                $scope.toggleInvoice = function (tabType, subTabType, invoice, idx, $event) {

                    ngivrPopupIncomingInvoice.show({
                        invoice: invoice,
                        $event: $event,
                        $parentScope: $scope,
                    })
                };

                /**
                 * Számlaegyeztető folyamat indítása
                 * @param item
                 */
                $scope.startReconcilation = async function (item) {
                    if ($scope.reconcilation) $scope.publish('clearReconcilation');
                    if (item.reconcilationId) { //ha van kész számlaegyeztetés
                        $scope.loadReconcilation(item)
                    } else { //ha még nincs kész számlaegyeztetés
                        $scope.reconcilation = {};

                        if (item.relatedInvoiceNumber !== undefined) { //ha van kapcsolódó számla, azt megkeressük, ez lesz a fő számla
                            let promise = ngivrApi.query('incomingInvoice', {search: {incomingInvoiceNumber: item.relatedInvoiceNumber}});
                            let response = await promise;
                            $scope.reconcilation.mainInvoiceFull = response.data.docs[0];
                            $scope.reconcilation.mainInvoice = response.data.docs[0]._id;
                            $scope.reconcilation.correctionInvoicesFull = [item];
                            $scope.reconcilation.correctionInvoices = [{id: item._id, deleted: false}]
                        } else {
                            $scope.reconcilation.mainInvoice = item._id;
                            $scope.reconcilation.mainInvoiceFull = item;
                            if (item.relatedInvoices.length) {
                                $scope.reconcilation.correctionInvoices = [];
                                $scope.reconcilation.correctionInvoicesFull = [];
                                for (let i in item.relatedInvoices) {
                                    let promise = (ngivrApi.query('incomingInvoice', {search: {incomingInvoiceNumber: item.relatedInvoices[i].invoiceNumber}}));
                                    let response = await promise;
                                    $scope.reconcilation.correctionInvoices.push({
                                        id: response.data.docs[0]._id,
                                        deleted: false
                                    });
                                    $scope.reconcilation.correctionInvoicesFull.push(response.data.docs[0])

                                }
                            }
                        }

                        $scope.publish('startReconcilation', '/api/tickets/without-invoice-by-partner/' + item.incomingSeller[0]._id, $scope.reconcilation)
                        $scope.publish('goToReconcilation')
                    }
                };

                /**
                 * Korrekcióra küldés
                 * @param item
                 * @param form
                 */
                $scope.sendToCorrection = function (item, form) {
                    if (!$scope.ngivr.form.validate(form)) {
                        ngivr.growl("Korrekcióra áthelyezés okát kötelező megadni!");
                    } else {
                        item.status = 'checked_correction';
                        ngivrApi.save('incomingInvoice', item).then(async () => {
                           // await this.ngivrLockListInstance.unlockDocument({doc: item});
                            //await ngivrLockService.unlock('invoice:' + item._id);
                            // $scope.lockIncomingInvoice(item._id, item, false);
                            // $scope.socketService.get();
                            $scope.item.allButtons = false
                            ngivrGrowl('Korrekcióra átrakva');
                        })
                    }
                };

                /**
                 * Számlaegyeztetés visszatöltése
                 * @param invoice
                 * @returns {Promise.<void>}
                 */
                $scope.loadReconcilation = async function (invoice) {
                    let promise = ngivrApi.id('reconcilation', invoice.reconcilationId);
                    let response = await promise;
                    $scope.reconcilation = response.data.doc;

                    promise = ngivrApi.id('incomingInvoice', $scope.reconcilation.mainInvoice);
                    response = await promise;
                    $scope.reconcilation.mainInvoiceFull = response.data.doc;
                    //await ngivrLockService.lock('invoice:' + $scope.reconcilation.mainInvoiceFull._id); //TODO ttl
                    // $scope.lockIncomingInvoice($scope.reconcilation.mainInvoiceFull._id, $scope.reconcilation.mainInvoiceFull, true);
                    if ($scope.reconcilation.correctionInvoices.length) $scope.reconcilation.correctionInvoicesFull = [];
                    for (let invoice of $scope.reconcilation.correctionInvoices) {
                        //if (!invoice.deleted) {
                        let invoicePromise = ngivrApi.id('incomingInvoice', invoice.id);
                        let invoiceResponse = await invoicePromise;
                        //await ngivrLockService.lock('invoice:' + invoiceResponse.data.doc._id); //TODO ttl
                        // $scope.lockIncomingInvoice(invoiceResponse.data.doc._id, invoiceResponse.data.doc, true);
                        $scope.reconcilation.correctionInvoicesFull.push(invoiceResponse.data.doc)
                        //}

                    }
                    //$scope.actId = invoice._id;
                    $scope.publish('startReconcilation', '/api/tickets/without-invoice-by-partner/' + invoice.incomingSeller[0]._id, $scope.reconcilation)
                };

            }

            search(query) {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {
                    status: $scope.item.type === 'all' ? undefined : $scope.item.type,
                    registryStatus: $scope.item.group === 'all' ? undefined : $scope.item.group,
                    $or: [
                        {
                            'incomingSeller.name': {  //keresés partner névben
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'incomingInvoiceNumber': {  //keresés számla sorszámban
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'referenceNumber': {  //keresés számla sorszámban
                                '$regex': search,
                                '$options': 'i'
                            }
                        }
                    ]
                };
            }


            isLocked(doc) {
                return false
                // return this.ngivrLockListInstance.isDocumentLocked({
                //     doc: doc
                // })
            };
        }
    }
});
