'use strict';

ngivr.angular.directive('ngivrFormUser', (ngivrService, $filter, ngivrConfirm, $state) => {
    const service = ngivrService;

    const schema = 'user';

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            ngivrId: '=',

            ngivrClose: '&',

        },
        templateUrl: 'components/ui/form/ngivr-form-user.html',
        controller: function ($scope, $mdMedia, Auth, ngivrHttp) {
            const self = this;
            $scope.$mdMedia = $mdMedia;
            $scope.ngivr = service;
            $scope.socketLockList = [];
            $scope.formLocked = false;
            $scope.state = $state;

            $scope.types = Object.keys(ngivrSettings.user.role);

            $scope.getRoleText = function (role) {
                return $scope.ngivr.strings.user.role[role];
            };

            $scope.ngivrFormSave = {

                validate: () => {

                    return true;
                },
                before: async () => {
                    $scope.model.ignore = true;
                    return new Promise((resolve, reject) => {
                        /* alert('before');*/
                        resolve(true);
                    });
                },
                after: async () => {

                }
                ,
                error: () => {
                    return new Promise((resolve, reject) => {
                        resolve('error');
                    });
                }
            };

            $scope.ngivrFormLoad = {
                before: () => {
                    return new Promise((resolve, reject) => {
                        //ngivr.growl('before load');
                        resolve(true);
                    });
                },
                after: () => {

                    //ngivr.growl('after load');
                },
                error: () => {
                    return new Promise((resolve, reject) => {
                        ngivr.growl('after error');
                        resolve(true);
                    });
                }
            };

            $scope.model = new ngivr.model.user();


        }
    }
});

