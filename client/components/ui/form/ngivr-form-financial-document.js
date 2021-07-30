'use strict';
ngivr.angular.directive('ngivFormFinancialDocument', (ngivrService) => {
    const service = ngivrService;

    const schema = 'financialDocument';

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            ngivrId: '=',
            ngivrClose: '&',
            ngivrLockOnUnlock: '&?'
        },
        templateUrl: 'components/ui/form/ngivr-form-financial-document.html',
        controller: function ($scope, socket) {
            const self = this;
            $scope.ngivr = service;
//console.log('ngivrLockOnUnlock2', $scope.ngivrLockOnUnlock)
            /*
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
            */

            $scope.model = new ngivr.model.financialDocument();

        }
    }
});
