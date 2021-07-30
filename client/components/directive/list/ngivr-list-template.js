'use strict';
ngivr.angular.directive('ngivrListTemplate', (ngivrConfirm, ngivrService) => {
  return {
    restrict: 'E',
    transclude: true,
    template: `<span ng-transclude></span>`,
    link: function(scope, element, attrs, controller, transclude) {
      scope.doc = scope.$parent.doc;
      scope.docs = scope.$parent.query.docs;
      scope.ref = scope.$parent.$parent.ngivrRef;
      scope.schema = scope.$parent.$parent.ngivrSchema;
      scope.query = scope.$parent.$parent.query;
      scope.$index = scope.$parent.$index + scope.query.skip ;
      scope.pageIndex = scope.$parent.$index;
      scope.docPrev = scope.$parent.query.docs[scope.$parent.$index - 1] || undefined;
      scope.docNext = scope.$parent.query.docs[scope.$parent.$index + 1] || undefined;
      scope.ngivr = ngivrService;
      scope.command = scope.$parent.$parent.command;
    }
  }
});
