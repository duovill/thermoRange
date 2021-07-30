const NgivrPopupShipOnOrderSplitterPopupController = function ($http, ngivrConfirm, Common, Auth, $scope, $filter, $mdDialog, ngModel, callback, ngivrTicket, ngivrGrowl, ngivrService, ngivrLockService, ngivrApi, changeSellContract, ngivrOrder, saveSellContract) {
    const start = async () => {


        $scope.ngivr = ngivrService;
        $scope.callback = callback;
        $scope.newNomination = ngModel;
        $scope.origSellContracts = angular.copy(ngModel.sellContracts);
        $scope.availableLoadedQuantity = 0;
        $scope.availableLoadedQuantityMax = 0;
        $scope.changeSellContract = changeSellContract;
        $scope.ngivrOrder = ngivrOrder;
        $scope.availablePossessionTransfers = [];
        $scope.$on('$destroy', async () => {
            await ngivrLockService.unlock('popupSplitter:' + $scope.newNomination._id)
        });

        if (!$scope.newNomination.splittedContract) {
            await ngivrLockService.lock('popupSplitter:' + $scope.newNomination._id, () => {
                $scope.splitOrdersCancel()
            })

        }

        const dataQuery = ngivrService.data.query({
            $scope: $scope,
            schema: 'ticket',
            url: '/api/tickets/get-possession-transfers',
            subscribe: async (promise) => {
                try {
                    const response = await promise;
                    $scope.availablePossessionTransfers = response.data;

                    // for (let pt of $scope.possessionTransfers) {
                    //     let resp = await ngivrApi.id('contract', pt.ledger[0].contractId);
                    //     pt.contractNumber = resp.data.doc.contractNumber;
                    //     if ($scope.order.technicalPerformId && $scope.order.technicalPerformId === pt._id) {
                    //         pt.checked = true
                    //     }
                    //     let res = 0;
                    //     for (let i in pt.technicalReservations) {
                    //         if (pt.technicalReservations[i].orderId !== $scope.order._id) {
                    //             res += pt.technicalReservations[i].quantity - pt.technicalReservations[i].performed
                    //         }
                    //
                    //     }
                    //     pt.free = pt.technicalRemain - res
                    // }
                    // $scope.origPts = angular.copy($scope.possessionTransfers);
                } catch (e) {
                    ngivr.growl.error(e);
                }
            }
        });

        $scope.possessionTransferQuery = {
            partner: undefined,
            site: undefined
        };

        $scope.$watch('possessionTransferQuery', async (newVal, oldVal) => {
            if (newVal.partner && newVal.site) {
                dataQuery.query({
                    limit: 0,
                    search: {
                        deleted: false,
                        sygnus: false,
                        direction: 'in',
                        ticketType: 'possessionTransfer',
                        'site.siteId': newVal.site._id,
                        'ownerId': newVal.partner._id,
                        // 'ledger.actualServiceContractId': $scope.order.selectedSourceServiceContract._id
                    },
                    sort: 'createdAt'
                })
            } else {
                $scope.availablePossessionTransfers = []

            }
        }, true);

        $scope.getAvailableLoadedQuantity = async function () {
            let response = await $http.post('/api/tickets/get-amount-on-tickets-ship-orders/', {cargoPlanId: $scope.newNomination._id});
            $scope.availableLoadedQuantity = Number(response.data.totalValue.toFixed(3));
            $scope.availableLoadedQuantityMax = Number(response.data.totalValue.toFixed(3));
        };

        let ordersToSplit = $scope.newNomination.bfks.concat($scope.newNomination.shts).concat($scope.newNomination.afks);

        for (let order of ordersToSplit) {
            if (order.splits !== undefined && order.splits.length || order.possessionTransferSplits !== undefined && order.possessionTransferSplits.length) {
                if (order.splits !== undefined && order.splits.length) {
                    for (let split of order.splits) {
                        let sellContract = $scope.newNomination.sellContracts.filter((o) => {
                            return o.contractId === split.contractId
                        });
                        sellContract[0].splitAmount = split.amount
                    }
                }
                if (order.possessionTransferSplits !== undefined && order.possessionTransferSplits.length) {
                    for (let split of order.possessionTransferSplits) {
                        let pt = $scope.newNomination.possessionTransfers.filter((o) => {
                            return o._id === split.ticketId
                        });
                        pt[0].splitAmount = split.amount
                    }
                }

            }
            else {
                await $scope.getAvailableLoadedQuantity();
            }
        }

        $scope.addPossessionTransfer = (pt) => {
            if (!$scope.newNomination.possessionTransfers) {
                $scope.newNomination.possessionTransfers = []
            }

            $scope.newNomination.possessionTransfers.push(angular.copy(pt))
        };

        $scope.removePossessionTransfer = async (idx) => {
            $scope.newNomination.possessionTransfers.splice(idx, 1);
            await $scope.getAvailableLoadedQuantity();

        };

        $scope.addSellContract = () => {
            if (!$scope.newNomination.sellContracts) {
                $scope.newNomination.sellContracts = []
            }
            $scope.newNomination.sellContracts.push({
                contractNumber: null,
                product: null,
                uniqueParams: '',
                toLoadQuantity: null
            })
        };

        $scope.removeSellContract = async (idx) => {
            $scope.newNomination.sellContracts.splice(idx, 1);
            await $scope.getAvailableLoadedQuantity();

        };

        $scope.hide = function () {
            $mdDialog.hide();
        };

        $scope.cancel = function () {
            $mdDialog.hide();
        };

        $scope.answer = function () {
            $mdDialog.hide();
        };

        $scope.saveButtonIsDisabled = false;

        $scope.splitOrdersSave = async function () {
            ngivr.overlay.show();
            //$scope.saveButtonIsDisabled = true;
            //await saveSellContract({})
            for (let i in $scope.newNomination.sellContracts) {
                if ($scope.newNomination.sellContracts[i].splitAmount < 0) {
                    ngivrGrowl('Nem adhat meg negatív értéket.');
                    ngivr.overlay.hide();
                    return
                }
                if ($scope.newNomination.sellContracts[i].splitAmount == null) {
                    ngivrGrowl('Nincs megadva minden érték.');
                    ngivr.overlay.hide();
                    return;
                }
            }

            if ($scope.availableLoadedQuantity > 0) {
                ngivrGrowl('A felosztandó menyiség nem teljes, mindet kötelező felosztani.');
                ngivr.overlay.hide();
                return;
            }

            if ($scope.availableLoadedQuantity < 0) {
                ngivrGrowl('A felosztott menyiség meghaladta a maximálisan feloszthatót.');
                ngivr.overlay.hide();
                return;
            }

            let split = {
                contracts: angular.copy($scope.newNomination.sellContracts),
                pts: angular.copy($scope.newNomination.possessionTransfers)
            };

            let object = {
                orders: [],
                contractIdAndAmountList: [],
                sygnusOutPossessionTransferTickets: []
            };

            for (let i in $scope.newNomination.sellContracts) {
                if (!$scope.newNomination.sellContracts[i]._id) {
                    await saveSellContract({sellContract: $scope.newNomination.sellContracts[i], index: i})
                }

                object.contractIdAndAmountList.push({
                    contractId: $scope.newNomination.sellContracts[i].contractId,
                    amount: Number($scope.newNomination.sellContracts[i].splitAmount.toFixed(3))
                })
            }

            for (let i in $scope.newNomination.possessionTransfers) {
                if ($scope.newNomination.possessionTransfers[i].splitAmount !== undefined && $scope.newNomination.possessionTransfers[i].splitAmount !== null) {
                    object.sygnusOutPossessionTransferTickets.push({
                        ticketId: $scope.newNomination.possessionTransfers[i]._id,
                        amount: Number($scope.newNomination.possessionTransfers[i].splitAmount.toFixed(3)),
                        comment: $scope.newNomination.possessionTransfers[i].comment,
                        partner: $scope.newNomination.possessionTransfers[i].partner,
                        sellContractNumber: $scope.newNomination.possessionTransfers[i].sellContractNumber,
                        fulfillmentDate: $scope.newNomination.possessionTransfers[i].fulfillmentDate,
                        diagramInfo: $scope.newNomination.possessionTransfers[i].diagramInfo,
                        technicalRemain: $scope.newNomination.possessionTransfers[i].technicalRemain
                    })
                }

            }

            for (let i in $scope.newNomination.bfks) {
                object.orders.push($scope.newNomination.bfks[i]._id)
            }

            // for (let i in $scope.newNomination.pkbs) {
            //   if ($scope.newNomination.pkbs[i].hasOwnProperty('_id')) {
            //     object.orders.push($scope.newNomination.pkbs[i]._id)
            //   }
            // }
            //
            // for (let i in $scope.newNomination.phts) {
            //   if ($scope.newNomination.pkbs[i].hasOwnProperty('_id')) {
            //     object.orders.push($scope.newNomination.pkbs[i]._id)
            //   }
            // }

            for (let i in $scope.newNomination.shts) {
                if ($scope.newNomination.shts[i].hasOwnProperty('_id')) {
                    if ($scope.newNomination.shts[i].parentOrderId) {
                        object.orders.push($scope.newNomination.shts[i].parentOrderId)
                    } else {
                        object.orders.push($scope.newNomination.shts[i]._id)
                    }

                }
            }

            try {

                await $http({
                    method: 'POST',
                    url: '/api/tickets/split-stocks-on-tickets-ship-orders/',
                    data: object,
                    timeout: ngivr.settings.http.noResponseTimeout
                });
                let pts = [];
                for (let pt of object.sygnusOutPossessionTransferTickets) {
                    let resp = await ngivrApi.id('ticket', pt.ticketId);
                    let posT = resp.data.doc;
                    // delete posT._id;
                    // delete posT.__v
                    // delete posT.createdAt;
                    // delete posT.updatedAt;
                    const toSend = Object.assign(posT, pt);

                    pts.push(toSend)
                }
                await $http.put('/api/cargoPlans/' + $scope.newNomination._id, {
                    splittedContract: true,
                    possessionTransfers: pts
                });
                $mdDialog.hide();
                $scope.saveButtonIsDisabled = false;

                // $scope.showAlert = function(ev) {
                //     // Appending dialog to document.body to cover sidenav in docs app
                //     // Modal dialogs should fully cover application
                //     // to prevent interaction outside of dialog
                $mdDialog.show({
                        parent: angular.element(document.body),
                        clickOutsideToClose: true,
                        template: '<md-dialog >' +
                        '<md-toolbar>\n' +
                        '      <div class="md-toolbar-tools">\n' +
                        '        <h2>Sikeres felosztás</h2>\n' +
                        '        <span flex></span>\n' +

                        '      </div>\n' +
                        '    </md-toolbar>' +
                        '  <md-dialog-content class="md-dialog-content">' +
                        `${$scope.availableLoadedQuantityMax} mt felosztva, az alábbiak szerint:<br>` +
                        '<div layout="row">\n                    <div flex>\n                    Sorszám\n</div>\n                    <div>\n                    Mennyiség\n</div>\n</div>' +
                        '<div ng-repeat="contract in split.contracts">' +
                        '<div layout="row">' +
                        '<div flex>' +
                        '{{contract.contractNumber}}' +
                        '</div>' +
                        '<div flex style="text-align: right">' +
                        '{{contract.splitAmount | number: 3}}' +
                        '</div>' +
                        '</div>' +

                        '</div>' +
                        '<div ng-repeat="pt in split.pts">' +
                        '<div layout="row">' +
                        '<div flex>' +
                        '{{pt.ticketName}}' +
                        '</div>' +
                        '<div flex flex style="text-align: right">' +
                        '{{pt.splitAmount | number: 3}}' +
                        '</div>' +
                        '</div>' +

                        '</div>' +
                        '        <md-button ng-click="closeDialog();">OK</md-button>' +
                        '  </md-dialog-content>' +
                        '</md-dialog>',
                        locals: {
                            availableLoadedQuantityMax: $scope.availableLoadedQuantityMax,
                            split: split
                        },
                        controller: DialogController
                    }
                );

                function DialogController($scope, $mdDialog, availableLoadedQuantityMax, split) {
                    $scope.availableLoadedQuantityMax = availableLoadedQuantityMax;
                    $scope.split = split;
                    $scope.closeDialog = function () {
                        $mdDialog.hide();
                    };
                }

            }
            catch (err) {
                ngivr.exception.handler(err);
            } finally {
                ngivr.overlay.hide()
            }
        };

        $scope.splitOrdersCancel = function () {
            $scope.splitOrdersEdit = false;
            $scope.newNomination.sellContracts = $scope.origSellContracts;
            $scope.newNomination.possessionTransfers = undefined;
            // for (let i in $scope.newNomination.sellContracts) {
            //     $scope.newNomination.sellContracts[i].splitAmount = null;
            // }
            $mdDialog.hide();
        };

        $scope.getAvailableLoadedQuantity = function (type, idx, value) {
            let contractValue = 0;

            for (let i in $scope.newNomination.sellContracts) {
                if (type === 'sc' && i == idx) {
                    contractValue += value === undefined ? 0 : value;
                } else {
                    contractValue += $scope.newNomination.sellContracts[i].splitAmount === undefined ? 0 : $scope.newNomination.sellContracts[i].splitAmount;
                }

            }

            for (let i in $scope.newNomination.possessionTransfers) {
                if (type === 'pt' && i == idx) {
                    contractValue += value === undefined ? 0 : value;
                } else {
                    contractValue += $scope.newNomination.possessionTransfers[i].splitAmount === undefined ? 0 : $scope.newNomination.possessionTransfers[i].splitAmount;
                }

            }

            $scope.availableLoadedQuantity = Number(($scope.availableLoadedQuantityMax - contractValue).toFixed(3));

            for (let i in $scope.newNomination.sellContracts) {
                if (type === 'sc' && i != idx) {
                    if ($scope.newNomination.sellContracts[i].splitAmount > $scope.getMaxAmountToSplit({
                            sc: $scope.newNomination.sellContracts[i],
                            idx: i
                        })) {
                        $scope.splitForm['splitAmount' + i].$setValidity('wrongNumber', false);//invalid legyen
                    } else {
                        $scope.splitForm['splitAmount' + i].$setValidity('wrongNumber', true);//valid legyen
                    }
                    //$scope.splitForm['splitAmount' + i].$validate()
                } else if (type === 'pt') { //ha pt, akkor minden sc-t validálunk
                    if ($scope.newNomination.sellContracts[i].splitAmount > $scope.getMaxAmountToSplit({
                            sc: $scope.newNomination.sellContracts[i],
                            idx: i
                        })) {
                        $scope.splitForm['splitAmount' + i].$setValidity('wrongNumber', false);//invalid legyen
                    } else {
                        $scope.splitForm['splitAmount' + i].$setValidity('wrongNumber', true);//valid legyen
                    }
                    //$scope.splitForm['splitAmount' + i].$validate()
                }
            }

            for (let i in $scope.newNomination.possessionTransfers) {
                if (type === 'sc' && i != idx) {
                    if ($scope.newNomination.possessionTransfers[i].splitAmount > $scope.getMaxAmountToSplit({
                            pt: $scope.newNomination.possessionTransfers[i],
                            idx: i
                        })) {
                        $scope.splitForm['ptSplitAmount_' + i].$setValidity('wrongNumber', false);//invalid legyen
                    } else {
                        $scope.splitForm['ptSplitAmount_' + i].$setValidity('wrongNumber', true);
                    }
                    // $scope.splitForm['ptSplitAmount_' + i].$validate()
                } else if (type === 'sc') { //ha sc, akkor minden pt-t validálunk
                    if ($scope.newNomination.possessionTransfers[i].splitAmount > $scope.getMaxAmountToSplit({
                            pt: $scope.newNomination.possessionTransfers[i],
                            idx: i
                        })) {
                        $scope.splitForm['ptSplitAmount_' + i].$setValidity('wrongNumber', false);//invalid legyen
                    } else {
                        $scope.splitForm['ptSplitAmount_' + i].$setValidity('wrongNumber', true);
                    }
                    // $scope.splitForm['ptSplitAmount_' + i].$validate()
                }
            }
        };

        $scope.getMaxAmountToSplit = (options) => {
            const {pt, sc, idx} = options;
            if (pt) {
                if (pt.technicalRemain < $scope.availableLoadedQuantity) {
                    return pt.technicalRemain
                }
            }

            let contractValue = 0;
            for (let i in $scope.newNomination.sellContracts) {
                if (sc === undefined) {
                    contractValue += $scope.newNomination.sellContracts[i].splitAmount === undefined ? 0 : $scope.newNomination.sellContracts[i].splitAmount;
                } else if (i != idx) {
                    contractValue += $scope.newNomination.sellContracts[i].splitAmount === undefined ? 0 : $scope.newNomination.sellContracts[i].splitAmount;
                }

            }

            for (let i in $scope.newNomination.possessionTransfers) {
                if (pt === undefined) {
                    contractValue += $scope.newNomination.possessionTransfers[i].splitAmount === undefined ? 0 : $scope.newNomination.possessionTransfers[i].splitAmount;
                } else if (i != idx) {
                    contractValue += $scope.newNomination.possessionTransfers[i].splitAmount === undefined ? 0 : $scope.newNomination.possessionTransfers[i].splitAmount;
                }

                // if (i != idx && pt !== undefined) {
                //
                // }
            }
            return Math.min(Number(($scope.availableLoadedQuantityMax - contractValue).toFixed(3)), pt ? Infinity : ngivrOrder.calculateFreeToDispo(sc, undefined, $scope.newNomination._id)) ;
        }

    };
    start();
};
NgivrPopupShipOnOrderSplitterPopupController.$inject = ['$http', 'ngivrConfirm', 'Common', 'Auth', '$scope', '$filter', '$mdDialog', 'ngModel', 'callback', 'ngivrTicket', 'ngivrGrowl', 'ngivrService', 'ngivrLockService', 'ngivrApi', 'changeSellContract', 'ngivrOrder', 'saveSellContract'];
