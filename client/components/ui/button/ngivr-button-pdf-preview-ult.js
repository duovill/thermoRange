'use strict';
ngivr.angular.directive('ngivrButtonPdfPreviewUlt', (ngivrService, ngivrTemplatePdf, ngivrButtonPdfShared) => {
  const service = ngivrService;

  return {
    controllerAs: '$ctrl',
    restrict: 'E',
    require: 'ngModel',
    transclude: true,
    scope: {
      url: '=ngModel',
      ngivrTemplate: '@',
      ngivrType: '@',
      ngivrTemplateRaw: '<',
      ngivrData: '<',
      ngivrTemplates: '<',
    },
    template: `

                  <div ng-if="ngivrData.deleted">
                    <md-button class="md-fab md-mini red-background" ng-disabled="true">
                    <img style="max-height: 24px;" src="../../../assets/icons/static/send.png">
                    </md-button>
                  </div>
                  <div ng-if="!ngivrData.deleted">
                    <md-button class="md-fab md-mini green-background" ng-click="$ctrl.preview()">
                      <img style="max-height: 24px;" src="../../../assets/icons/static/send.png">
                    </md-button>
                  </div>

`,
    controller: function($scope) {
      $scope.ngivr = service;

      const templatePdf = new ngivrTemplatePdf({
        template: $scope.ngivrTemplate,
        templateRaw: $scope.ngivrTemplateRaw,
        templates: $scope.ngivrTemplates,
      })

//      console.log($scope.ngivrTemplate)
//      console.log($scope.ngivrTemplateRaw)
//      console.log($scope.ngivrTemplates)

      templatePdf.generator.boot();
      $scope.templatePdf = templatePdf;

      const shared = new ngivrButtonPdfShared($scope, templatePdf)

      this.preview = shared.preview;
    }
  }
});
