'use strict';
ngivr.angular.directive('ngivrPopupGenerateContract', (ngivrService) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        require: 'ngModel',
        transclude: true,
        scope: {
            ngivrDisabled: '=',
            ngModel: '=',
            ngIf: '='
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
<md-button class="waves-effect waves-whitesmoke btn-small btn btn-grey" style="width: fit-content" ng-disabled="ngivrDisabled"
                       ng-click="ngivrDisabled || showAdvanced($event)""
                      >
              Szerződés generálása
            </md-button>
          
        </div>`,
        controller: function ($scope, $mdDialog) {

            $scope.ngivr = service;

            const start = async () => {

                $scope.showAdvanced = function (ev) {
                    if (ev !== undefined) {
                        ev.stopImmediatePropagation();
                    }

                    $scope.popupObject = {
                        bindToController: true,
                        controller: NgivrPopupGenerateContractPopupController,
                        templateUrl: 'components/ui/popup/generateContract/ngivr-popup-generate-contract.html',
                        parent: angular.element(document.body),
                        targetEvent: ev,
                        clickOutsideToClose: false,
                        fullscreen: true, // Only for -xs, -sm breakpoints.
                        ngModel: $scope.ngModel,
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
