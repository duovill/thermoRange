'use strict';
ngivr.angular.directive('ngivrPortletAction', function() {
  return {
    restrict: 'E',
    transclude: true,
    template: '<ng-transclude/>'
  }
});

