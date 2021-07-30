/**
 * Created by Kovács Marcell on 2017.03.16..
 */
'use strict';
ngivr.angular.directive('ngivrPopupShipOnOrderSplitter', (ngivrService) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        require: 'ngModel',
        transclude: true,
        scope: {
            ngivrDisabled: '=',
            ngIf: '=',
            ngModel: '=',
            callback: '=',
            splitted: '<',
            changeSellContract: '&',
            saveSellContract: '&'
        },
        link: (scope, elm, attrs) => {
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
        template: `<div ng-if="ngIf">
          <a ng-click="showAdvanced($event)" ng-disabled="isLocked()" class="waves-effect waves-grey btn fw-btn btn-raised-default"><ng-md-icon icon="send"></ng-md-icon><span>Felosztási mennyiségek {{ngModel.splittedContract ? 'megtekintése' : 'megadása'}}</span></a>
        </div>`,
        controller: function ($scope, $mdDialog, socket, ngivrLockService, Auth, $timeout) {

            $scope.ngivr = service;

            const start = async () => {
                // const redisLocks = await ngivrLockService.getAllLocks();
                // $scope.redisLockList = redisLocks.data;
                //
                //
                // const lockListener = async () => {
                //   const redisLocks = await ngivrLockService.getAllLocks();
                //   $scope.redisLockList = redisLocks.data
                // };
                //
                // socket.socket.on('ngivr-lock-response-get-locks', lockListener);
                //
                // $scope.$on('$destroy', async () => {
                //   socket.socket.removeListener('ngivr-lock-response-get-locks', lockListener);
                // });
                //
                // window.onbeforeunload = async function () {
                //   await ngivrLockService.unlockMore()
                // };

                const ngivrFormLockSubscriber = (locksData) => {
                    $scope.redisLockList = locksData.locks;

                    $timeout(() => $scope.$apply());
                };

                ngivrLockService.subscribe(ngivrFormLockSubscriber);

                $scope.$on('$destroy', async () => {
                    await ngivrLockService.unlockMore();
                    ngivrLockService.unsubscribe(ngivrFormLockSubscriber)
                });

                $scope.isLocked = function () {

                    try {
                        let lock = $scope.redisLockList.filter((o) => {
                            return o.doc === 'popupSplitter' + ':' + $scope.ngModel._id
                        });

                        if (!lock.length) return false;


                        if (lock[0].user !== Auth.getCurrentUser()._id) return true;

                    }
                    catch (err) {
                        return false
                    }


                    return false
                };

                $scope.showAdvanced = function (ev) {

                    $scope.popupObject = {
                        bindToController: true,
                        controller: NgivrPopupShipOnOrderSplitterPopupController, //$controller('NgivrVehiclePopupController'),
                        templateUrl: 'components/ui/popup/shipOnOrderSplitter/ngivr-popup-ship-on-order-splitter.html',
                        parent: angular.element(document.body),
                        targetEvent: ev,
                        clickOutsideToClose: false,
                        fullscreen: true, // Only for -xs, -sm breakpoints.
                        ngModel: $scope.ngModel,
                        callback: $scope.callback,
                        changeSellContract: $scope.changeSellContract,
                        saveSellContract: $scope.saveSellContract
                    };

                    $mdDialog.show($scope.popupObject)
                        .then(function (answer) {
                            $scope.status = 'You said the information was "' + answer + '".';
                        }, function () {
                            $scope.status = 'You cancelled the dialog.';
                        })
                        .finally(function () {
                        });
                };
            };

            start()


        }
    }
});
