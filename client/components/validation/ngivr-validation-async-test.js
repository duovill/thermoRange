'use strict';

ngivr.angular.directive('ngivrValidationAsyncTest', function ($q, $parse, Common, ngivrApi, $timeout) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {

            ctrl.$asyncValidators.ngivrValidationAsyncTest = (modelValue, viewValue) => {
                let defer = $q.defer();

                $timeout(() => {
                    ngivr.growl('ngivrValidationAsyncTest ok megjott')
                    defer.resolve()
                }, 10000)

                return defer.promise;
            };
        }
    };
});
