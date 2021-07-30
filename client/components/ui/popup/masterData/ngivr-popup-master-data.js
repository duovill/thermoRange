'use strict';
ngivr.angular.directive('ngivrPopupMasterData', (ngivrService) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        // require: 'ngModel',
        transclude: true,
        scope: {
            product: '=?',
            schema: '='
        },
        link: (scope, elm, attrs, ctrl) => {
            if (attrs.type === undefined) {
                attrs.type = 'popup';
            }
            switch (attrs.schema) {
                case 'product':
                    scope.strings = {
                        tooltip: 'productData',
                        button: 'productData'
                    };
                    break;
                case 'partner':
                    scope.strings = {
                        tooltip: 'partnerData',
                        button: 'partnerData'
                    };
                    break;
                case 'depot':
                    scope.strings = {
                        tooltip: 'depotData',
                        button: 'depotData'
                    };
                    break;
            }
            scope.strings.schema = attrs.schema
        },
        template: `<div >
                    <ngivr-button  ng-disabled="false" ng-click="showAdvanced($event)">
                      <md-tooltip>{{ngivr.strings.tooltip[strings.tooltip]}}</md-tooltip>
                      {{ngivr.strings.button[strings.button]}}
                    </ngivr-button>
                  </div>
                  
      `,
        controller: function ($scope, $mdDialog) {

            $scope.ngivr = service;

            $scope.showAdvanced = function (ev) {

                $mdDialog.show({
                    controller: PopupController,
                    templateUrl: 'components/ui/popup/masterData/ngivr-popup-master-data.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: false, // Only for -xs, -sm breakpoints.
                    schema: $scope.strings.schema,
                    ngivr: $scope.ngivr,

                })
                    .then(function (answer) {
                        $scope.status = 'You said the information was "' + answer + '".';

                    }, function (product) {
                        $scope.status = 'You cancelled the dialog.';

                    });
            };

            function PopupController($scope, $mdDialog, ngivr, schema) {
                $scope.ngivr = ngivr;
                $scope.schema = schema
                //$scope.ngivrId = $scope.product._id;

                $scope.showForm = function (id) {
                    $scope.showEditor = 1;
                    if (id) {
                        $scope.selectedId = id;
                    } else {
                        $scope.selectedId = undefined;
                    }
                };

                $scope.cancelEdit = function () {
                    $scope.showEditor = 0;
                    $scope.editedItem = null;
                    $scope.showNeuQualityParam = false;
                };

                // $scope.changeVisible = function (item) {
                //     if(item.visible) {
                //         item.visible = false;
                //     }
                //     else {
                //         item.visible = true;
                //     }
                //     $http.put('/api/products/' + item._id, {visible: item.visible});
                // };


                $scope.cancel = function () {
                    $mdDialog.cancel();
                };

                $scope.answer = function (answer) {

                };

            }
        }
    }
});
