ngivr.angular.factory('ngivrPopupIncomingInvoice', function ($mdDialog, ngivrException) {


    return new function () {

        this.show = async (options) => {

            try {
                const result = await $mdDialog.show({
                    controller: function ($scope, ngivrService, ngivrLock, ngivrApi) {



                        $scope.ngivr = ngivrService;
                        $scope.doc = options.invoice;

                        $scope.registryStatusList = options.$parentScope.registryStatusList;
                        $scope.typeList = options.$parentScope.typeList;
                        $scope.incomingTypesList = options.$parentScope.incomingTypesList;
                        $scope.item = options.$parentScope.item;
                        $scope.ref = options.$parentScope;
                        $scope.startReconcilation = options.$parentScope.startReconcilation;
                        $scope.loadReconcilation = options.$parentScope.loadReconcilation;
                        //$scope.correctionSending = options.$parentScope.correctionSending;
                        /**
                         * Korrekcióra küldés megjelenítése, elrejtése
                         * @param doc
                         * @param show
                         */
                        $scope.correctionSending = async (doc, show) => {
                            try {
                                doc.showCorrectionRow = show;
                                doc.correctionComment = undefined;
                                if (show) {
                                    $scope.lock.lock()
                                    //await this.ngivrLockListInstance.lockDocument({doc: doc})
                                    //await ngivrLockService.lock('invoice:' + doc._id); //TODO ttl
                                } else {
                                    $scope.lock.unlock()
                                    //await this.ngivrLockListInstance.unlockDocument({doc: doc})
                                    //await ngivrLockService.unlock('invoice:' + doc._id)
                                }
                            } catch (e) {
                                ngivrException.handler(e)
                            }

                        };
                        $scope.sendToCorrection = options.$parentScope.sendToCorrection;
                        // $scope.changeStatus = options.$parentScope.changeStatus;
                        /**
                         * Módosítja a számla státuszát
                         * @param doc
                         * @param status
                         */
                        $scope.changeStatus = async (doc, status) => {
                            doc.status = status;
                            if (status === 'registered') {
                                await $scope.correctionSending(doc, false)
                            }
                            $scope.item.allButtons = true;
                            ngivrApi.save('incomingInvoice', doc)
                        };

                        $scope.editIncomingInvoice = () => {
                            ngivrGrowl('Egyeztetett számla nem szerkeszthető')
                        }
                        //$scope.isLocked = options.$parentScope.isLocked;


                        $scope.editIncomingInvoice = options.$parentScope.editIncomingInvoice;
                        $scope.socketService = options.$parentScope.socketService;
                        $scope.payModeList = options.$parentScope.payModeList;

                        const ngivrDataId = ngivrService.data.id({
                            schema: 'incomingInvoice',
                            model: $scope.doc,
                            $scope: $scope,
                        });

                        $scope.lock = ngivrLock({
                            scope: $scope,
                            resource: `incomingInvoice:${$scope.doc._id}`,
                            schema: 'incomingInvoice',
                            //watchEditing: 'isUpdateWeightEdit',
                            scopeDecorator: {
                                onAutoUnlockOrError: {
                                    //cancelFunction: async () => await $scope.answer()
                                },

                                unlock: {
                                    functionName: ['sendToCorrection', 'hide'],
                                }
                            }
                        });

                        // Promise reject
                        $scope.cancel = function (beforeCancel) {
                            if (beforeCancel !== undefined) {
                                $scope[beforeCancel]($scope.doc)
                            }
                            $mdDialog.cancel();
                        };

                        /*
                        // Promise resolve
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };

                        // Promise resolve - with result
                        $scope.answer = function (answer) {
                            $mdDialog.hide(answer);
                        };
                        */

                    },
                    templateUrl: 'components/ui/popup/incoming-invoice/ngivr-popup-incoming-invoice.html',
                    parent: angular.element(document.body),
                    targetEvent: options.$event,
                    clickOutsideToClose: true,
                    // fullscreen: true // Only for -xs, -sm breakpoints.
                });
                console.warn(result)
            } catch (error) {
                if (error !== undefined) {
                    ngivrException.handler(error)
                }
            }
        }

    };

});
