'use strict';
ngivr.angular.directive('ngivrPopupPartnerEditor', (ngivrService) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        // require: 'ngModel',
        transclude: true,
        scope: {
            partner: '=?',
            wrongFields: '<?'

        },
        link: (scope, elm, attrs, ctrl) => {
            if (attrs.type === undefined) {
                attrs.type = 'popup';
            }

        },
        template: `<div >
                    <ngivr-button  ng-disabled="!partner" ng-click="!partner || showAdvanced($event)">
                      <md-tooltip>{{ngivr.strings.tooltip.editPartner}}</md-tooltip>
                      {{ngivr.strings.button.editPartner}}
                    </ngivr-button>
                                <ng-md-icon ng-if="wrongFields.length" icon="info"><md-tooltip class="tt-multiline">{{ngivr.strings.tooltip.wrongPartnerData}}<br><span ng-repeat="field in wrongFields"> {{field}}<br></span> </md-tooltip></ng-md-icon>
                  </div>
                  
      `,
        controller: function ($scope, $mdDialog) {

            $scope.ngivr = service;

            $scope.showAdvanced = function (ev) {

                $mdDialog.show({
                    controller: PopupController,
                    templateUrl: 'components/ui/popup/partnerEditor/ngivr-popup-partner-editor.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: false, // Only for -xs, -sm breakpoints.
                    partner: $scope.partner,
                    ngivr: $scope.ngivr,

                })
                    .then(function (answer) {
                        $scope.status = 'You said the information was "' + answer + '".';

                    }, function () {
                        $scope.status = 'You cancelled the dialog.';

                    });
            };

            function PopupController($scope, $mdDialog, ngivr, partner) {
                $scope.ngivr = ngivr;
                $scope.partner = partner;
                //$scope.ngivrId = $scope.partner._id;
                $scope.subscribe('originalSameChanged', (originalSame) => {
                    $scope.originalSame = originalSame
                });

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
