'use strict';
ngivr.angular.directive('ngivrMasterHtmlTemplate', function () {
  return {
    templateUrl: 'app/master/htmlTemplates/view/ngivr-master-html-template.html',
    controllerAs: '$ctrl',
    controller: function ($scope, socket, $http, $rootScope, $state, $stateParams, ngivrService, ngivrTemplateSchemaHelper) {

      const self = this;

      /**
       * Definitions
       */
      const setting = new ngivr.api.htmlTemplate.model.setting();
      $scope.setting = setting;
      const command = new ngivr.api.htmlTemplate.command($scope, $state, ngivrService, ngivrTemplateSchemaHelper);
      $scope.command = command;

      $scope.template = new ngivr.model.htmlTemplate();

      /**
       * Hide master view when true
       * @type {boolean}
       */
      $scope.$parent.fullSizeRequired = 1;

      /**
       * It minimizes the the view.
       */
      $scope.$on('$destroy', function () {
        $scope.$parent.fullSizeRequired = 0;
      });

      /**
       * Ebben vannak a html sablonok
       */
      ngivrService.data.all({
        schema: 'HtmlTemplate',
        scope: $scope,
        subscribe: (type, item, data) => {
          setting.htmlTemplates = data;
          if ($stateParams.id) {
            setting.htmlTemplates.find((element) => {
              if (element._id == $stateParams.id) {
                command.template.load(element);
                return true;
              }
              $state.go('.', {id: undefined}, {notify: false});
              return false;
            });
          }
        }
      })
    }
  }
});
