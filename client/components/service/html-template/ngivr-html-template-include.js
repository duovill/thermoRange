'use strict';
ngivr.angular.directive('ngivrHtmlTemplateInclude', (ngivrTemplateSchemaHelper, ngivrService ) => {

  return {
    restrict: 'E',
    scope: {
      ngivrTemplate: '@',
      ngivrData: '<',
    },
    template: `<span bind-html-compile="templateHtml"></span>`,
    link: function ($scope , element, attrs, controller, transclude) {
      for(let tpl of $scope.$parent.generator.templates) {
        if (tpl.partialName === attrs.ngivrTemplate) {
          $scope.templateHtml = tpl.html;
          break;
        }
      }
      $scope.template = angular.copy($scope.$parent.generator.foundTemplate);
      Object.assign($scope, $scope.$parent.generator.data);
      $scope.strings = angular.copy($scope.$parent.strings);
      $scope.stringsCommon = angular.copy($scope.$parent.stringsCommon);
      $scope.instanceCount = $scope.$parent.instanceCount;
      $scope.language = $scope.$parent.language;
      $scope.helper = ngivrTemplateSchemaHelper;
      $scope.ngivr = ngivrService;
    }
  };
});
