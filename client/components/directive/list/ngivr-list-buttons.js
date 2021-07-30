'use strict';
ngivr.angular.directive('ngivrListButtons', (ngivrService) => {
  return {
    restrict: 'E',
    transclude: true,
    template: `<span ng-transclude></span>`,
    link: function(scope, element, attrs, controller, transclude) {
      scope.ref = scope.$parent.ngivrRef;
      scope.schema = scope.$parent.ngivrSchema;
      scope.ngivr = ngivrService;
      scope.$parent.$watch('query', function() {
          scope.query = scope.$parent.query;
      })
    }
  }
});
