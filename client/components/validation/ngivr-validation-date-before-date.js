'use strict';

ngivr.angular.directive('ngivrValidationDateBeforeDate', function ($q, $parse, Common, ngivrApi, ngivrGrowl) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$validators.ngivrValidationDateBeforeDate = (modelValue, viewValue) => {
                if (ctrl.$isEmpty(modelValue)) {
                    return true
                }

                let minDate = $parse(attrs.ngivrValidationDateBeforeDate)(scope);
                let compareTimeMinimum, modelTime;
                if (typeof minDate === 'string') {
                    compareTimeMinimum = new Date(minDate).getTime()
                } else {
                    compareTimeMinimum = minDate.getTime()
                }

                if (typeof modelValue === 'string') {
                    modelTime = new Date(modelValue).getTime()
                } else {
                    modelTime = modelValue.getTime()
                }

                return modelTime >= compareTimeMinimum;

            };
        }
    };
});
