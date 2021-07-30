'use strict';
ngivr.angular.directive('ngivrPopupNewPartner', (ngivrService) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        // require: 'ngModel',
        transclude: true,
        scope: {
            newPartner: '=?',
            contract: '=?',
            checkedPartner: '=?',
            isChecked: '=?',
            ngivrMenu: '<?',
        },
        link: (scope, elm, attrs, ctrl) => {
            if (attrs.type === undefined) {
                attrs.type = 'popup';
            }

        },
        template: `

<md-menu-item ng-if="ngivrMenu === true">
    <md-button ng-disabled="ngDisabled" ng-click="ngDisabled || showAdvanced($event)">
      <ng-md-icon icon="add"></ng-md-icon>    
      {{ngivr.strings.button.addNewPartner}}
    </md-button>
</md-menu-item>

<div ng-if="ngivrMenu !== true">
<ngivr-button  ng-disabled="ngDisabled" ng-click="ngDisabled || showAdvanced($event)">
  <ng-md-icon icon="add"></ng-md-icon>
  <md-tooltip>{{ngivr.strings.tooltip.addNewPartner}}</md-tooltip>
  {{ngivr.strings.button.addNewPartner}}
</ngivr-button>
</div>
                  
      `,
        controller: function ($scope, $mdDialog) {

            $scope.ngivr = service;

            $scope.showAdvanced = function (ev) {
                if ($scope.contract) {
                    $scope.contract.newPartner[0].approved = true;
                    //const currentDate = new Date();
                    $scope.checkedPartner.time = new Date();
                    $scope.contract.newPartner[0].checked = $scope.checkedPartner;
                }



                $mdDialog.show({
                    controller: PopupController,
                    templateUrl: 'components/ui/popup/newPartner/ngivr-popup-new-partner.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: false, // Only for -xs, -sm breakpoints.
                    ngModel: $scope.ngModel,
                    newPartner: $scope.newPartner,
                    contract: $scope.contract,
                    ngivr: $scope.ngivr,
                    isChecked: $scope.isChecked
                })
                    .then(function (answer) {
                        $scope.status = 'You said the information was "' + answer + '".';

                    }, function () {
                        $scope.status = 'You cancelled the dialog.';

                    });
            };

            function PopupController($scope, $mdDialog, newPartner, ngivr, contract, isChecked) {
                $scope.ngivr = ngivr;
                $scope.newPartner = newPartner;
                $scope.contract = contract;
                $scope.isChecked = isChecked;


                $scope.cancel = function () {
                    $mdDialog.cancel();
                };

                $scope.answer = function (answer) {

                };

            }
        }
    }
});
