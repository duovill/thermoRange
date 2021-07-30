'use strict';
ngivr.angular.directive('ngivrPortletBody', function() {
  return {
    restrict: 'E',
    transclude: true,
    template: '<ng-transclude/>'
  }
});
