'use strict';
ngivr.angular.directive('ngivrFilterkebabCase', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attrs, modelCtrl) {
      const kebabCase = (inputValue) => {
        if (inputValue == undefined) {
          inputValue = '';
        }
        const kebabCased = ngivr.String.kebabCase(inputValue);
        if (kebabCased !== inputValue) {
          modelCtrl.$setViewValue(kebabCased);
          modelCtrl.$render();
        }
        return kebabCased;
      };
      modelCtrl.$parsers.push(kebabCase);
      kebabCase(scope[attrs.ngModel]); // capitalize initial value
    }
  };
});


