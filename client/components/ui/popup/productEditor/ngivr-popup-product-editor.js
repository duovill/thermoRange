'use strict';
ngivr.angular.directive('ngivrPopupProductEditor', (ngivrService) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        // require: 'ngModel',
        transclude: true,
        scope: {
            product: '=?',

        },
        link: (scope, elm, attrs, ctrl) => {
            if (attrs.type === undefined) {
                attrs.type = 'popup';
            }

        },
        template: `<div >
                    <ngivr-button  ng-disabled="!product" ng-click="!product || showAdvanced($event)">
                      <md-tooltip>{{ngivr.strings.tooltip.editProduct}}</md-tooltip>
                      {{ngivr.strings.button.editProduct}}
                    </ngivr-button>
                  </div>
                  
      `,
        controller: function ($scope, $mdDialog) {

            $scope.ngivr = service;

            $scope.showAdvanced = function (ev) {

                $mdDialog.show({
                    controller: PopupController,
                    templateUrl: 'components/ui/popup/productEditor/ngivr-popup-product-editor.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: false, // Only for -xs, -sm breakpoints.
                    product: $scope.product,
                    ngivr: $scope.ngivr,

                })
                    .then(function (answer) {
                        $scope.status = 'You said the information was "' + answer + '".';

                    }, function (product) {
                        $scope.status = 'You cancelled the dialog.';

                    });
            };

            function PopupController($scope, $mdDialog, ngivr, product) {
                $scope.ngivr = ngivr;
                $scope.product = product;
                $scope.subscribe('originalSameChanged', (originalSame) => {
                    $scope.originalSame = originalSame
                });
                //$scope.ngivrId = $scope.product._id;


                $scope.cancel = async function () {
                    if (!$scope.originalSame) {
                        try {
                            await ngivr.confirm(
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

            }
        }
    }
});
