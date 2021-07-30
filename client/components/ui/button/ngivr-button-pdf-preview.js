'use strict';
ngivr.angular.directive('ngivrButtonPdfPreview', (ngivrService, ngivrTemplatePdf, ngivrButtonPdfShared) => {
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
<span ng-if="ngivrType == 'flat'">
          <md-button aria-label=" PDF {{ ngivr.strings.button.preview }}" ng-click="$ctrl.preview()">
      <ng-md-icon icon="picture_as_pdf"></ng-md-icon>
         PDF {{ ngivr.strings.button.preview }}
        </md-button>

</span>
<span ng-if="ngivrType != 'flat'">
<ngivr-button ng-click="$ctrl.preview()" >
    <ng-md-icon icon="pageview"></ng-md-icon>
     PDF {{ ngivr.strings.button.preview }}
</ngivr-button>
</span>
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
