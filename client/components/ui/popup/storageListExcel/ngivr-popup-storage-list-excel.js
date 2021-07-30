'use strict';

ngivr.angular.directive('ngivrPopupStorageListExcel', (ngivrService) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        // require: 'ngModel',
        transclude: true,
        controller: function ($rootScope, $scope, $mdDialog) {
            $scope.ngivr = service;

            $mdDialog.show({

                templateUrl: 'components/ui/popup/storageListExcel/ngivr-popup-storage-list-excel.html',
                fullscreen: false,
                controller: StorageListController

            });


            function StorageListController($rootScope, $scope, $mdDialog) {

                const start = async () => {

                    $scope.fileName = "Tárolási lista";
                    /**
                     * Bezárja a popup-ot
                     */
                    $scope.close = function () {
                        $mdDialog.hide().then(() => {
                            $rootScope.$broadcast("closePopup");
                        });
                    };

                    // $scope.downloadList = () => {
                    //     $scope.publish('downloadList')
                    // }

                    $scope.triggerBuildListQuery = () => {
                        $scope.publish('triggerBuildListQuery')
                    };

                    $scope.subscribe('listQueryChanged', (listQuery) => {
                        $scope.listQuery = listQuery
                    })
                };

                start()


            }
        }
    }
});
