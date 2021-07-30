'use strict';

ngivr.angular.directive('ngivrValidationAccountLength', function ($parse) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elm, attrs, ctrl) {
      ctrl.$validators.ngivrValidationAccountLength = (modelValue, viewValue) => {
        let settings = $parse(attrs.ngivrValidationAccountLength)(scope);
        if (ctrl.$isEmpty(modelValue)) return true;
        if (settings.iban) {
          return viewValue.length <= 42;
        } else {
          return viewValue.length === 17 || viewValue.length === 26;
        }
      };
    }
  };
});
