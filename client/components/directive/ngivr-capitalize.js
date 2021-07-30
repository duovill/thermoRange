'use strict';
ngivr.angular.directive('ngivrCapitalize', () => {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, element, attrs, modelCtrl) {
      const capitalize = (inputValue) => {
        if (inputValue == undefined) inputValue = '';
        const capitalized = inputValue.toUpperCase();
        if (capitalized !== inputValue) {
          modelCtrl.$setViewValue(capitalized);
          modelCtrl.$render();
        }
        return capitalized;
      };
      modelCtrl.$parsers.push(capitalize);
      capitalize(scope[attrs.ngModel]); // capitalize initial value
    }
  };
});
