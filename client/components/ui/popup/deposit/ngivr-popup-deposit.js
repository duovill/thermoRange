/**
 * Created by Kovács Marcell on 2017.03.16..
 */
'use strict';
ngivr.angular.directive('ngivrPopupDeposit', (ngivrService) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        // require: 'ngModel',
        transclude: true,
        scope: {
            partnerId: '<?',
            partner: '=?',
            contract: '=?'
        },
        link: (scope, elm, attrs, ctrl) => {
            if (attrs.type === undefined) {
                attrs.type = 'popup';
            }

        },
        template: `<div >
                    <ngivr-button  ng-click="showAdvanced($event)">
                      <ng-md-icon icon="add"></ng-md-icon>
                      <md-tooltip>{{ngivr.strings.tooltip.addDeposit}}</md-tooltip>
                      {{ngivr.strings.button.deposit}}
                    </ngivr-button>
                  </div>
                  
      `,
        controller: function ($scope, $mdDialog, socket, ngivrSocketLock, ngivrApi, ngivrException) {

            $scope.ngivr = service;
            $scope.socketService = ngivrSocketLock;

            $scope.subscribe('loadDeposit', (deposit) => {

                $scope.showAdvanced(undefined, deposit)
            });

            $scope.showAdvanced = async function (ev, deposit) {
                try {
                    if (!$scope.partner) {
                        let resp = await ngivrApi.id('partner', $scope.partnerId);
                        $scope.partner = resp.data.doc
                    }



                    $mdDialog.show({
                        controller: PopupController,
                        templateUrl: 'components/ui/popup/deposit/ngivr-popup-deposit.html',
                        parent: angular.element(document.body),
                        targetEvent: ev,
                        clickOutsideToClose: false,
                        fullscreen: false, // Only for -xs, -sm breakpoints.
                        ngModel: $scope.ngModel,
                        partner: $scope.partner,
                        contract: $scope.contract,
                        ngivr: $scope.ngivr,
                        deposit: deposit

                    })
                        .then(function (answer) {
                            $scope.status = 'You said the information was "' + answer + '".';

                        }, function () {
                            $scope.status = 'You cancelled the dialog.';

                        });
                } catch (e) {
                    ngivrException.handler(e);
                }

            };

            function PopupController($http, Common, Auth, $scope, $filter, $mdDialog, ngModel, ngivrApi, partner, ngivr, contract, deposit) {
                $scope.ngivr = ngivr;
                $scope.partner = partner;
                $scope.contract = contract;
                if ($scope.contract) { //szerződés kimutatóban dolgozunk

                    $scope.deposit = {
                        partner: $scope.partner.name,
                        contractNumber: $scope.contract.contractNumber,
                        currency: $scope.contract.currency,
                        direction: $scope.contract.buy ? 'out' : 'in',
                        product: $scope.contract.product[0]

                    };
                    $scope.deposit = Object.assign($scope.deposit, deposit);

                    $scope.deposit.paymentDate = $filter('date')($scope.deposit.paymentDate, 'yyyy.MM.dd')


                } else { //partner szerkesztőben dolgozunk

                    $scope.deposit = {partner: $scope.partner.name};
                    $scope.deposit = Object.assign($scope.deposit, deposit);

                    $scope.deposit.paymentDate = $filter('date')($scope.deposit.paymentDate, 'yyyy.MM.dd')

                }

                $scope.cancel = function () {
                    $mdDialog.cancel();
                };

                $scope.answer = async function () {
                    await $scope.saveDeposit();
                };

                $scope.saveDeposit = async () => {
                    if (!$scope.ngivr.form.validate($scope.depositForm)) {
                        throw new Error("Sikertelen form validáció");
                    }
                    if ($scope.deposit.direction === 'in') {
                        $scope.deposit.buyer = $scope.partner;
                    } else {
                        $scope.deposit.seller = $scope.partner;
                    }
                    $scope.deposit.type = 'product';
                    $scope.deposit.partnerId = $scope.partner._id;
                    $scope.deposit.contractId = $scope.contract ? $scope.contract._id : undefined;
                    $scope.deposit.productId = $scope.contract ? $scope.contract.product[0]._id : $scope.deposit.product ? $scope.deposit.product._id : undefined;

                    if ($scope.deposit._id) {
                        await $http.put('/api/deposits/' + $scope.deposit._id, $scope.deposit)
                    } else {
                        await $http.post('/api/deposits', $scope.deposit)
                    }
                    $mdDialog.hide();
                }
            }
        }
    }
});
