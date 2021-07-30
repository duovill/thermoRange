'use strict';

ngivr.angular.directive('ngivrValidationDateBefore', function ($q, $parse, Common, ngivrApi, ngivrGrowl) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$validators.ngivrValidationDateBefore = (modelValue, viewValue) => {
                if (ctrl.$isEmpty(modelValue)) {
                    return true
                }

                let minDate = $parse(attrs.ngivrValidationDateBefore)(scope);
                let d = new Date();
                d.setMonth(d.getMonth() - minDate);


                return modelValue >= d;

            };
        }
    };
});
