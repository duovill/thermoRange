'use strict';
ngivr.angular.directive('ngivrPortletTitle', function() {
  return {
    restrict: 'E',
    transclude: true,
    template: '<ng-transclude/>'
  }
});

