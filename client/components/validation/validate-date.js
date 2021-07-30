'use strict';
ngivr.angular.directive('validDate', function ($parse) {
  return {
    require: 'ngModel',
    link: function (scope, elm, attrs, ctrl) {
      let length = $parse(attrs.validDate)(scope);
      ctrl.$validators.validDate = function (modelValue, viewValue) {
        if (!length) length = 10;
        if (ctrl.$isEmpty(modelValue)) {
          return true;
        }
        if (isNaN(Date.parse(viewValue)) || viewValue.length < length) {
          return false
        }
        return true
      };
    }
  };
});
