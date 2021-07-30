'use strict';
ngivr.angular.directive('ngivrPopupTransportEquipmentEditor', (ngivrService) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        // require: 'ngModel',
        transclude: true,
        scope: {
            doc: '<',

        },
        link: (scope, elm, attrs, ctrl) => {
            if (attrs.type === undefined) {
                attrs.type = 'popup';
            }

        },
        template: `<div >
<ngivr-icon-fa
                        ng-click="showAdvanced($event)"
                        ngivr-tooltip="{{ ngivr.strings.button.edit }}"
                        ngivr-tooltip-direction="left"
                        ngivr-icon-fa="fa-wrench"
                    ></ngivr-icon-fa>
                    </div>


                  
      `,
        controller: function ($scope, $mdDialog) {

            $scope.ngivr = service;

            $scope.showAdvanced = function (ev) {

                $mdDialog.show({
                    controller: PopupController,
                    templateUrl: 'components/ui/popup/transportEquipmentEditor/ngivr-popup-transport-equipment-editor.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: false, // Only for -xs, -sm breakpoints.
                    doc: $scope.doc,
                    ngivr: $scope.ngivr,

                })
                    .then(function (answer) {
                        $scope.status = 'You said the information was "' + answer + '".';

                    }, function (product) {
                        $scope.status = 'You cancelled the dialog.';

                    });
            };

            function PopupController($scope, $mdDialog, ngivr, doc, ngivrApi) {
                $scope.ngivr = ngivr;
                $scope.doc = doc;

                $scope.saveDoc = async () => {
                    ngivrApi.save('financialCostBearer', doc);
                    $mdDialog.cancel()
                };

                $scope.cancel = function () {
                    $mdDialog.cancel();
                };

                $scope.answer = function (answer) {

                };

            }
        }
    }
});
