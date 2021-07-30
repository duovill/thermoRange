/**
 * Created by Kovács Marcell on 2017.03.16..
 */
'use strict';
ngivr.angular.directive('ngivrPopupLedgerSplitter', (ngivrService) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        // require: 'ngModel',
        transclude: true,
        scope: {
            ngDisabled: '=?',
            ngModel: '=',
            ngDirection: '=',
            ledgerIndex: '=',
            callback: '=',
            fromOrder: '<',
            splitWeight: '<'
        },
        link: (scope, elm, attrs, ctrl) => {
            if (attrs.type === undefined) {
                attrs.type = 'popup';
            }
            if (attrs.style === undefined) {
                attrs.style = '';
            }
            if (attrs.class === undefined) {
                attrs.class = '';
            }
            if (attrs.ekaer === undefined) {
                attrs.ekaer = false;
            }
        },
        template: `<div "> 
                  <ngivr-icon-static ng-disabled="ngDisabled"
                  ngivr-tooltip="Mérlegjegy megosztásához"
                  ng-click="ngDisabled || showAdvanced($event)" ngivr-fa-margin="margin-top: 0px;"
                  ngivr-icon="divide"/>
                        <span ng-show="splitWeight !== undefined">
                          <md-tooltip md-direction="right">{{ ngivr.strings[splitWeight] }}</md-tooltip>
                          {{ ngModel.ledger[ledgerIndex][splitWeight] }} mt
                        </span>
                 </div>
                 <!--<div ng-if="ngDirection == 'out'">-->
                      <!--<ngivr-icon-static ng-disabled="ngDisabled"-->
                      <!--ngivr-tooltip="Mérlegjegy megosztásához"-->
                      <!--ng-click="ngDisabled || showAdvanced($event)" ngivr-fa-margin="margin-top: 0px;"-->
                      <!--ngivr-icon="divide"/>-->
                      <!--<span>-->
                          <!--<md-tooltip md-direction="right">{{ ngivr.strings.unloadedWeight }}</md-tooltip>-->
                          <!--{{ ngModel.ledger[ledgerIndex].unloadedWeight }} mt-->
                      <!--</span>-->
                 <!--</div>-->
      `,
        controller: function ($scope, $mdDialog, socket, ngivrSocketLock, ngivrGrowl, Auth, $http, ngivrApi) {
            $scope.ngivr = service;
            $scope.socketService = ngivrSocketLock;
            $scope.showAdvanced = function (ev) {
                $scope.publish('popupLedger', true);
                $mdDialog.show({
                    controller: PopupController,
                    templateUrl: 'components/ui/popup/ledgerSplitter/ngivr-popup-ledger-splitter.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: false, // Only for -xs, -sm breakpoints.
                    ngModel: $scope.ngModel,
                    ngDirection: $scope.ngDirection,
                    ledgerIndex: $scope.ledgerIndex,
                    callback: $scope.callback,
                    fromOrder: $scope.fromOrder,
                    splitWeight: $scope.splitWeight,
                    multiple: true
                })
                    .then(function (answer) {
                        $scope.status = 'You said the information was "' + answer + '".';
                    }, function () {
                        $scope.status = 'You cancelled the dialog.';
                    });
            };

            function PopupController($scope, $mdDialog, ngivrService, ngModel, ngDirection, ledgerIndex, callback, ngivrLedgerSplitter, Common, fromOrder, splitWeight) {

                $scope.ngivr = ngivrService;
                $scope.splitter = {
                    orderNumber: '',
                    value: ''
                };
                $scope.order = null; // erre az orderre osztunk
                $scope.ngModel = ngModel; // a ticket
                $scope.ledgerIndex = ledgerIndex;
                $scope.cb = callback;
                $scope.ngDirection = ngDirection; // osztandó ticket iránya
                $scope.progressActivated = false;
                $scope.fromOrder = fromOrder; //az osztandó order
                $scope.splitWeight = splitWeight; // az osztandó mennyiség, internal esetén a cél order határozza meg
                $scope.orderError = {};

                $scope.splitterTypes = [];
                $scope.splitterTypes.push({
                    id: ngivrSettings.splitType.splitLedgerToDifferentDispo,
                    value: 'Megosztás diszpozíciók közt'
                });
                $scope.splitterTypes.push({
                    id: ngivrSettings.splitType.splitLedgerToSameDispo,
                    value: 'Megosztás szerződésen belül'
                });

                if ($scope.ngModel.ticketType === 'possessionTransfer') {
                    $scope.splitType = ngivrSettings.splitType.splitLedger;
                }
                else {
                    $scope.splitType = ngivrSettings.splitType.splitLedgerToDifferentDispo;
                }

                if ($scope.fromOrder.direction === 'internal') {
                    $scope.$watch('order', async (newVal) => { // a cél order vizsgálata az osztandó súly megállapításához
                        if (newVal) {
                            if (newVal.sygnus) { // sygnusos célorder
                                if (newVal.direction !== 'internal') { // in, vagy out célorder
                                    let resp = await ngivrApi.id('parity', newVal.parityId);
                                    const parity = resp.data.doc;
                                    resp = await ngivrApi.id('contract', newVal.contractId);
                                    const contract = resp.data.doc;
                                    // console.warn('parity',parity);
                                    // console.warn('contract', contract);
                                    if (newVal.direction === 'in') {
                                        if (contract.buy) { //vétel esetén
                                            if (parity.transCostBuy) { // ha sygnusé a fuvar
                                                $scope.splitWeight = 'loadedWeight' //a felrakott súlyt osztjuk
                                            } else { // nem sygnusé a fuvar
                                                $scope.splitWeight = 'unloadedWeight' //a lerakott súlyt osztjuk
                                            }
                                        } else { // eladás esetén (ilyen nincs)

                                        }

                                    } else if (newVal.direction === 'out') {
                                        if (!contract.buy) { //eladás esetén
                                            if (parity.transCostSell) { // ha sygnusé a fuvar
                                                $scope.splitWeight = 'unloadedWeight' //a felrakott súlyt osztjuk
                                            } else { // nem sygnusé a fuvar
                                                $scope.splitWeight = 'loadedWeight' //a lerakott súlyt osztjuk
                                            }
                                        } else { // vétel esetén (ilyen nincs)

                                        }
                                    }
                                } else { // internal célorder

                                }

                            } else { //partneres célorder

                            }

                        }

                    }, true)
                }

                /**
                 * Maximálisan megosztható mennyiséget kalkulálja
                 */
                // $scope.getMaxSplitValue = () => {
                //
                //     if ($scope.ngModel.direction === 'in' || $scope.ngModel.direction === 'external_in' || $scope.ngModel.direction === 'internal_in') {
                //         if ($scope.ngModel.ledger[$scope.ledgerIndex].remain > $scope.ngModel.ledger[ledgerIndex].loadedWeight) {
                //             return $scope.ngModel.ledger[ledgerIndex].loadedWeight
                //         } else {
                //             return $scope.ngModel.ledger[$scope.ledgerIndex].remain
                //         }
                //     } else {
                //         return $scope.ngModel.ledger[$scope.ledgerIndex].remain
                //     }
                //
                //
                // };

                $scope.hide = function () {
                    $mdDialog.hide();
                    if ($scope.cb) {
                        return $scope.cb();
                    }
                };

                $scope.cancel = function () {
                    $mdDialog.hide();
                    if ($scope.cb) {
                        return $scope.cb();
                    }
                };

                /**
                 * Megosztás gomb
                 * @param form
                 */
                $scope.answer = function (form) {
                    if (!$scope.ngivr.form.validate(form)) {
                        //ngivr.growl('Hiba! A formot nem sikerült validalni', 'error');
                        return;
                    }

                    $scope.splitter.value = Number($scope.splitter.value.toFixed(3));

                    switch ($scope.splitType) {
                        case ngivrSettings.splitType.splitLedgerToDifferentDispo: //Megosztás diszpozíciók közt
                            if ($scope.order == null) return;
                            //$scope.progressActivated = true;
                            ngivr.overlay.show();
                            ngivrLedgerSplitter.splitLedgerToDifferentDispo({
                                splitWeight: $scope.splitWeight,
                                direction: $scope.ngDirection,
                                ticket: $scope.ngModel,
                                ledgerIndex: $scope.ledgerIndex,
                                orderNumber: $scope.splitter.orderNumber,
                                value: $scope.splitter.value,
                                cb: async function (updatedTicket) {
                                    if (updatedTicket) {
                                        let resp = await ngivrApi.id('ticket', updatedTicket._id);
                                        let origLedgerId = $scope.ngModel.ledger[$scope.ledgerIndex]._id;
                                        let updatedTicketLedgerIdx = Common.functiontofindIndexByKeyValue(resp.data.doc.ledger, '_id', origLedgerId);
                                        $scope.ngModel.ledger[$scope.ledgerIndex] = resp.data.doc.ledger[updatedTicketLedgerIdx]
                                    }
                                    ngivr.overlay.hide();
                                    //$scope.progressActivated = false;
                                    $mdDialog.hide();
                                    if ($scope.cb) {
                                        return $scope.cb();
                                    }
                                }
                            });
                            break;
                        case ngivrSettings.splitType.splitLedgerToSameDispo: //Megosztás szerződésen belül
                            ngivr.overlay.show();
                            //$scope.progressActivated = true;
                            ngivrLedgerSplitter.splitLedgerToSameDispo({
                                splitWeight: $scope.splitWeight,
                                direction: $scope.ngDirection,
                                ticket: $scope.ngModel,
                                ledgerIndex: $scope.ledgerIndex,
                                value: $scope.splitter.value,
                                cb: function () {
                                    ngivr.overlay.hide();
                                    // $scope.progressActivated = false;
                                    $mdDialog.hide();
                                    if ($scope.cb) {
                                        return $scope.cb();
                                    }
                                }
                            });
                            break;
                        case ngivrSettings.splitType.splitLedger:
                            ngivr.overlay.show();
                            //$scope.progressActivated = true;
                            ngivrLedgerSplitter.splitLedger($scope.ngModel, $scope.ledgerIndex, $scope.splitter.value, function () {
                                ngivr.overlay.hide();
                                // $scope.progressActivated = false;
                                // $mdDialog.hide();
                                if ($scope.cb) {
                                    return $scope.cb();
                                }
                            });
                            break;
                    }
                };

                $scope.changeSplitType = function (type) {

                    $scope.splitType = type;

                }
            }
        }
    }
});
