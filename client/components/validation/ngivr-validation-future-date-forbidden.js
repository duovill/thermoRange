'use strict';

ngivr.angular.directive('ngivrValidationFutureDateForbidden', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$validators.ngivrValidationFutureDateForbidden = (modelValue, viewValue) => {
                if (ctrl.$isEmpty(modelValue)) {
                    return true
                }
                let compareTime;
                if (typeof modelValue === 'string') {
                    compareTime = new Date(modelValue).getTime()
                } else {
                    compareTime = modelValue.getTime()
                }
                return new Date().getTime() > compareTime
            };
        }
    };
});
