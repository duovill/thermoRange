'use strict';

ngivr.angular.directive('ngivrValidationIsSame', function ($q, $parse, Common, ngivrApi, ngivrGrowl) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$validators.ngivrValidationIsSame = (modelValue, viewValue) => {
                let compareValue = $parse(attrs.ngivrValidationIsSame)(scope);
                if (ctrl.$isEmpty(modelValue)) {
                    return true
                }

                return compareValue === modelValue

            };
        }
    };
});
