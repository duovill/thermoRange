/**
 * Created by Kovács Marcell on 2017.03.16..
 */
'use strict';
ngivr.angular.directive('ngivrPopupVehicle', (ngivrService) => {
    let popupIndex = 0;
    const service = ngivrService;
    return {
        restrict: 'E',
        // require: 'ngModel',
        transclude: true,
        scope: {
            // it nem hasznalhato az ngDisabled, hasznaljuk a ngivrDisabled-et!
            ngivrDisabled: '=',
            ngModel: '=',
            ngBuyContract: '=',
            ekaer: '=',
            type: '@',
            style: '@',
            class: '@',
            ngDepotSources: '=',
            outerIdx: '=',
            cardType: '=',
            unloadLocations: '=',
            itks: '=',
            sellContracts: '=',
            dispos: '=',
            index: '=',
            sites: '=',
            vehicles: '=',
            callback: '=',
            cancelTcn: '=',
            vehicleLockedByCheckbox: '<',
            uniqueVehicle: '<?'
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
        template: `<div ng-if="ngModel == undefined">
                    <ngivr-button type="button" ngivr-type="flat" ng-disabled="ngivrDisabled" ng-click="ngivrDisabled || showAdvanced($event)">
                      <ng-md-icon icon="add"></ng-md-icon>
                      <md-tooltip>{{ngivr.strings.tooltip.addVehicles}}</md-tooltip>
                      {{ngivr.strings.button.uniqueVehicle}}
                    </ngivr-button>
                   </div>
                   <div ng-if="ngModel != undefined">
                       <ngivr-icon-fa
                     ng-disabled="ngivrDisabled"
                     ngivr-tooltip="Szerkesztés" ngivr-icon-fa="fa-pencil"
                     ng-click="ngivrDisabled || showAdvanced($event)"/>
                    <!--<ngivr-icon-static count="23"  ng-disabled="ngivrDisabled" ng-click="ngivrDisabled || showAdvanced($event)" ngivr-icon="edit" ngivr-tooltip="Szerkesztés"/>-->
                   </div>
        `,
        controller: function ($scope, $mdDialog, socket, ngivrSocketLock, ngivrGrowl, Auth, ngivrEkaer, ngivrTicket, ngivrApi, ngivrLockService, $timeout) {

            popupIndex++;
            const thisPopupIndex = popupIndex;
//            console.log(thisPopupIndex);
//            console.log($scope.ngModel ? $scope.ngModel._id : 'nincs model');
            $scope.ngivr = service;
            $scope.socketService = ngivrSocketLock;
            let catchUnlockCallbackDestroyer

            const formLog = () => `Id: ${thisPopupIndex}`;

            $scope.showAdvanced = async function (ev) {

                if ($scope.ngModel !== undefined) {
                    // let thisLock = await ngivrLockService.lock('vehicle:' + $scope.ngModel._id);
                    // $scope.lock = thisLock;
                    // if (catchUnlockCallbackDestroyer !== undefined) {
                    //     catchUnlockCallbackDestroyer();
                    // }
                    $scope.origNomination = angular.copy($scope.newNomination);
                    // catchUnlockCallbackDestroyer = ngivrLockService.catchUnlockCallback($scope, 'vehicle:' + $scope.ngModel._id, $scope.closePopup);
                    $scope.ngDisabled = false;
                }

                $scope.popupObject = {
                    bindToController: true,
                    controller: NgivrVehiclePopupController, //$controller('NgivrVehiclePopupController'),
                    templateUrl: 'components/ui/popup/vehicle/ngivr-popup-vehicle.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: false, // Only for -xs, -sm breakpoints.
                    ngModel: $scope.ngModel,
                    ngBuyContract: $scope.ngBuyContract,
                    ngDepotSources: $scope.ngDepotSources,
                    outerIdx: $scope.outerIdx,
                    cardType: $scope.cardType,
                    unloadLocations: $scope.unloadLocations,
                    itks: $scope.itks,
                    sellContracts: $scope.sellContracts,
                    index: $scope.index,
                    sites: $scope.sites,
                    ekaer: $scope.ekaer,
                    vehicles: $scope.vehicles,
                    dispos: $scope.dispos,
                    callback: $scope.callback,
                    reload: $scope.reload,
                    thisPopupIndex: thisPopupIndex,
                    vehicleLockedByCheckbox: $scope.vehicleLockedByCheckbox,
                    uniqueVehicle: $scope.uniqueVehicle,
                    multiple: true
                };

                // if ($scope.ngModel && $scope.ngModel._id) {
                //     const ngivrFormLockSubscriber = (locksData) => {
                //         $scope.redisLockList = locksData.locks;
                //         let currentResource;
                //         if ($scope.ngModel) currentResource = 'vehicle:' + $scope.ngModel._id;
                //         let user = Auth.getCurrentUser()._id;
                //         let currentLockData = undefined;
                //         $scope.locked = undefined;
                //         for (let lockData of locksData.locks) {
                //
                //             if (lockData.doc === currentResource) {
                //                 $scope.locked = lockData;
                //                 if (lockData.user !== user) {
                //                     $scope.locked = lockData;
                //                     break;
                //                 }
                //                 currentLockData = lockData;
                //                 break;
                //             }
                //         }
                //
                //         $timeout(() => $scope.$apply(() => {
                //
                //             if (currentLockData !== undefined && $scope.lock !== undefined) {
                //                 $scope.locked = undefined;
                //                 let renewExpirationTimeoutCallback = Math.max((currentLockData.timeout - 15) * 1000, 0);
                //                 const generateLog = (text) => {
                //                     ngivr.console.group(`NGIVR-FORM:lock `);
                //                     console.log(`${text} resource`, currentLockData.doc, 'by', Auth.getCurrentUser().nickName, 'timeout', currentLockData.timeout, 'renewExpirationTimeoutCallback', renewExpirationTimeoutCallback / 1000 /*, 'on', new Date($scope.lock.expiration), 'ttl', currentLockData.ttl, 'renewExpirationTimeoutCallback', renewExpirationTimeoutCallback , 'lock.expiration', $scope.lock.expiration, 'generatedRenewExpirationTimeoutCallback', generatedRenewExpirationTimeoutCallback, typeof generatedRenewExpirationTimeoutCallback */)
                //                     ngivr.console.group()
                //                 };
                //
                //                 generateLog('will renew');
                //
                //                 const renewTimeoutCallback = () => {
                //                     generateLog('renewing now');
                //                     ngivrLockService.emitRenew({
                //                         resource: currentLockData.doc,
                //                         user: currentLockData.user,
                //                         ttl: currentLockData.ttl,
                //                         id: socket.ioClient.id,
                //                     })
                //                 };
                //                 $timeout.cancel(ngivrFormLockSubscriber.renewTimeout);
                //                 ngivrFormLockSubscriber.renewTimeout = $timeout(renewTimeoutCallback, renewExpirationTimeoutCallback)
                //
                //             } else {
                //                 ngivr.console.group(`VEHICLE-POPUP:lock ${formLog()}`)
                //                 console.log('renewing disabled, not editing')
                //                 ngivr.console.group();
                //                 $timeout.cancel(ngivrFormLockSubscriber.renewTimeout);
                //             }
                //             if (currentLockData === undefined && $scope.lock !== undefined) {
                //                 $scope.lock = undefined
                //                 // self.close(true);
                //             }
                //         }));
                //     };
                //
                //     ngivrFormLockSubscriber.id = 'vehiclePopup_' + thisPopupIndex;
                //     ngivrLockService.subscribe(ngivrFormLockSubscriber);
                // }

                $mdDialog.show($scope.popupObject)
                    .then(async function (answer) {
                        $scope.status = 'You said the information was "' + answer + '".';
                        //await $scope.lockVehicle($scope.index, $scope.ngModel, false);
                        $scope.cancelTcn($scope.ngModel, $scope.ngBuyContract);
                        //ngivrLockService.unsubscribe(ngivrFormLockSubscriber)
                    }, async function () {
                        $scope.status = 'You cancelled the dialog.';
                        //await $scope.lockVehicle($scope.index, $scope.ngModel, false);
                        $scope.cancelTcn($scope.ngModel, $scope.ngBuyContract);
                        // ngivrLockService.unsubscribe(ngivrFormLockSubscriber)
                    })
                    .finally(function () {
                    });
            };

            $scope.reload = function () {

                ngivrApi.id('orderVehicle', $scope.popupObject.ngModel._id).then(function (response) {
                    $scope.popupObject.ngModel = response.data.doc;

                    $mdDialog.show($scope.popupObject)
                        .then(function (answer) {
                            $scope.status = 'You said the information was "' + answer + '".';
                            //$scope.lockVehicle($scope.index, $scope.ngModel, false);
                            $scope.cancelTcn($scope.ngModel, $scope.ngBuyContract);
                            // ngivrLockService.unsubscribe(ngivrFormLockSubscriber)
                        }, function () {
                            $scope.status = 'You cancelled the dialog.';
                            //$scope.lockVehicle($scope.index, $scope.ngModel, false);
                            $scope.cancelTcn($scope.ngModel, $scope.ngBuyContract);
                            //ngivrLockService.unsubscribe(ngivrFormLockSubscriber)
                        })
                        .finally(function () {
                            //ngivrLockService.unsubscribe(ngivrFormLockSubscriber)
                            //$scope.popup = undefined;
                        });
                })
            };

            // $scope.lockVehicle = async (index, value, lock) => {
            //
            //     try {
            //         if (lock) {
            //             let thisLock = await ngivrLockService.lock('vehicle:' + value._id);
            //             $scope.lock = thisLock;
            //             if (catchUnlockCallbackDestroyer !== undefined) {
            //                 catchUnlockCallbackDestroyer();
            //             }
            //             catchUnlockCallbackDestroyer = ngivrLockService.catchUnlockCallback($scope, 'vehicle:' + $scope.ngModel._id, $scope.closePopup);
            //
            //             $scope.ngDisabled = false;
            //
            //         } else {
            //             await ngivrLockService.unlock('vehicle:' + value._id);
            //             $scope.lock = undefined
            //         }
            //
            //     } catch (err) {
            //         console.log(err)
            //     }
            // };

            $scope.closePopup = () => {
                $scope.publish('closePopup')
            }

        }
    }
});
