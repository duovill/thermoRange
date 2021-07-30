'use strict';
ngivr.angular.directive('ngivrFormServiceOrder', (ngivrService) => {
    const service = ngivrService;

    const schema = 'serviceOrder';

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            ngivrId: '=',
            ngivrClose: '&'
        },
        templateUrl: 'components/ui/form/ngivr-form-service-order.html',
        controller: function ($scope, socket) {
            const self = this;
            $scope.ngivr = service;

            $scope.ngivrFormSave = {
                validate: () => {
                    ngivr.growl('before validate');
                },
                before: () => {
                    return new Promise((resolve, reject) => {
                        ngivr.growl('before save');
                        resolve(true);
                    });
                },
                after: () => {
                    ngivr.growl('after save');
                },
                //after: () => alert('after'),
                error: () => {
                    return new Promise((resolve, reject) => {
                        ngivr.growl('after error');
                        resolve(true);
                    });
                }
            };

            $scope.ngivrFormLoad = {
                before: () => {
                    return new Promise((resolve, reject) => {
                        ngivr.growl('before load');
                        resolve(true);
                    });
                },
                after: () => {
                    ngivr.growl('after load');
                },
                error: () => {
                    return new Promise((resolve, reject) => {
                        ngivr.growl('after error');
                        resolve(true);
                    });
                }
            };

            $scope.model = new ngivr.model.serviceOrder();

        }
    }
});
