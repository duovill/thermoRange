'use strict';
ngivr.angular.directive('ngivrValidationMongoose', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function (value) {
        ngModel.$setValidity('ngivrValidationMongoose', true);
        return value;
      });
    }
  };
});
