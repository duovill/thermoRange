'use strict';

ngivr.angular.directive('ngivrValidationEInvoice', function ($q, $parse, Common, ngivrApi, ngivrGrowl) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$validators.ngivrValidationEInvoice = (modelValue, viewValue) => {
                let  appearance = $parse(attrs.ngivrValidationEInvoice)(scope);
                if (ctrl.$isEmpty(modelValue)) {
                    return true
                }
                if (appearance === 'ELECTRONIC' || appearance === 'EDI') {
                    return !!modelValue.invoiceEmail;
                }

                return true

            };
        }
    };
});
