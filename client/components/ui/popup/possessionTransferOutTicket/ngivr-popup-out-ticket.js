'use strict';
ngivr.angular.directive('ngivrPopupOutTicket', (ngivrService) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        // require: 'ngModel',
        transclude: true,
        scope: {
            possessionTransfer: '<',
            style: '@'

        },
        link: (scope, elm, attrs, ctrl) => {
            if (attrs.type === undefined) {
                attrs.type = 'popup';
            }

        },
        template: `<div >
                    <ngivr-button   ng-click="showAdvanced($event)" style="{{style}}">
                      <md-tooltip>{{ngivrService.strings.tooltip.makeOutTicket}}</md-tooltip>
                      {{ngivrService.strings.button.makeOutTicket}}
                    </ngivr-button>
                  </div>
                  
      `,
        controller: function ($scope, $mdDialog) {

            $scope.ngivrService = service;

            $scope.showAdvanced = function (ev) {

                $mdDialog.show({
                    controller: PopupController,
                    templateUrl: 'components/ui/popup/possessionTransferOutTicket/ngivr-popup-out-ticket.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: false, // Only for -xs, -sm breakpoints.
                    possessionTransfer: $scope.possessionTransfer,
                    ngivrService: $scope.ngivrService,

                })
                    .then(function (answer) {
                        $scope.status = 'You said the information was "' + answer + '".';

                    }, function () {
                        $scope.status = 'You cancelled the dialog.';

                    });
            };

            function PopupController($scope, $mdDialog, ngivrService, possessionTransfer, ngivrApi, Auth, ngivrHttp, Common, ngivrLock) {

                const start = async () => {
                    $scope.maxQuantity = possessionTransfer.technicalRemain || 10;
                    $scope.ngivr = ngivrService;
                    $scope.currentUser = Auth.getCurrentUser();
                    let resp = await ngivrApi.id('ticket', possessionTransfer.ledger[0].relatedTicketId);
                    $scope.possessionTransfer = resp.data.doc;
                    $scope.model = new ngivr.model.ticket({user: $scope.currentUser});
                    $scope.model.sygnusPossessionTicketId = possessionTransfer._id;
                    $scope.model.sygnus = false;
                    $scope.model.direction = 'out';
                    $scope.model.ledger[0].sourceServiceContractId = $scope.possessionTransfer.ledger[0].actualServiceContractId;
                    $scope.model.depot = $scope.possessionTransfer.depot;
                    $scope.model.site = $scope.possessionTransfer.site;
                    $scope.model.ownerId = $scope.possessionTransfer.ownerId;
                    $scope.model.ownerName = $scope.possessionTransfer.ownerName;
                    $scope.model.productId = $scope.possessionTransfer.productId;
                    $scope.model.productName = $scope.possessionTransfer.productName;
                    $scope.original = angular.copy($scope.model);
                    $scope.lockId = possessionTransfer._id;

                    $scope.lock = ngivrLock({
                        scope: $scope,
                        //watchId: 'lockId',
                        schema: 'ticket',
                        resource: `ticket:${$scope.lockId}`
                        //watchEditing: 'isUpdateWeightEdit',
                        //scopeDecorator: {
                        // onAutoUnlockOrError: {
                        //     cancelFunction: async () => await $scope.cancelUpdateWeight({autoUnlock: true})
                        // },
                        // lock: {
                        //     functionName: 'updateWeight',
                        // },
                        // unlock: {
                        //     functionName: ['saveUpdateWeight', 'cancelUpdateWeight', 'answer'],
                        // }
                        // }
                    });

                    $scope.lock.lock()

                    /**
                     * ORIGINALSAME
                     */
                    Object.defineProperty($scope, 'originalSame', {
                        //set: (value) = stb..
                        get: () => {
                            const model = angular.toJson($scope.model);
                            const original = angular.toJson($scope.original);
                            const test = model === original;
                            return test;
                        }
                    });

                    /**
                     * Kimenő mérlegjegy rögzítése
                     * @returns {Promise<void>}
                     */
                    $scope.save = async () => {
                        if (!$scope.ngivr.form.validate($scope.outTicketFromPossessionTransferForm)) {
                            return;
                        }
                        try {
                            await $scope.ngivr.confirm(
                                'Biztosan rögzíti a mérlegjegyet?',
                            );
                            $scope.model.ledger[0].loadedWeight = $scope.model.loadedWeight;
                            $scope.model.ledger[0].unloadedWeight = $scope.model.loadedWeight;
                            $scope.model.loadDate = $scope.model.fulfillmentDate;
                            let response = await ngivrHttp.get(`/api/counters/PKT${ngivr.settings.plusPrefix}`);
                            $scope.model.ticketName = `PKT${ngivr.settings.plusPrefix}` + new Date().getFullYear().toString().slice(-2) + '/' + Common.formatNumberLength(response.data.counter, 5);
                            console.log($scope.model);
                            await ngivrHttp.post('/api/tickets', $scope.model);
                            $mdDialog.cancel();
                        } catch (e) {

                        }

                    };


                    $scope.cancel = async function () {
                        if (!$scope.originalSame) {
                            try {
                                await $scope.ngivr.confirm(
                                    ngivr.strings.question.modelNotSame,
                                    ngivr.strings.message.close,
                                    undefined,
                                    undefined,
                                    true
                                );

                            } catch (e) {
                                ngivr.growl.error(e);
                                return
                            }

                        }
                        $mdDialog.cancel();
                    };

                    $scope.answer = function (answer) {

                    };
                };

                start()
            }
        }
    }
});
