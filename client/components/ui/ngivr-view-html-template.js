'use strict';
ngivr.angular.directive('ngivrViewHtmlTemplate', function(ngivrService, $timeout) {

  const service = ngivrService;

  return {
    restrict: 'E',
    scope: {
      ngivrData: '<',
      ngivrTemplate: '@',
      ngivrTemplateRaw: '<',
      ngStyle: '='
    },
    link: (scope, element, attrs, controller, transcludeFn) => {
      scope.ngivrTemplateStatic = attrs.ngivrTemplate;
    },
    template: `<iframe ng-style="{{ ngStyle}} " srcdoc="{{ html | ngivrRawHtml }}" frameborder="0" style="width: 100%; height: 100%; resize: vertical;"></iframe>`,
   controller: class  {

     constructor($scope, ngivrTemplateGenerator) {
       this.$scope = $scope;
       this.ngivrTemplateGenerator = ngivrTemplateGenerator;
     }

     $onDestroy() {
       this.cancelGeneratorTimeout();
     }

     cancelGeneratorTimeout() {
       if (this.generatorTimeout !== undefined) {
         $timeout.cancel(this.generatorTimeout);
       }
     }

     $onInit() {
       const $scope = this.$scope;
       const generator = new this.ngivrTemplateGenerator();

       this.generatorTimeout = undefined;
       const generate = () => {
         this.cancelGeneratorTimeout();
         $timeout(() => {
           $scope.$digest();
           this.generatorTimeout = $timeout(async () => {
             const { html, qr }  = await generator.generate();
             $scope.html = String(html).replace(/\${qr}/g, qr);
           }, 500)
         })
       };

       const ngivrTemplateGenerator = () => {
         if ($scope.ngivrTemplateRaw !== undefined) {
           generator.templateRaw = $scope.ngivrTemplateRaw;
         } else {
           generator.template = $scope.ngivrTemplate || $scope.ngivrTemplateStatic;
         }
         generate();
       };

       ngivrTemplateGenerator($scope.ngivrTemplate);

       ngivrService.data.all({
         schema: 'HtmlTemplate',
         scope: $scope,
         subscribe: (type, item, data) => {
           generate();
         }
       });

       $scope.$watch('ngivrData', (data) => {
         generator.data = data;
         generate();
       }, true);

       $scope.$watch('ngivrTemplate', () => ngivrTemplateGenerator(), true);
       $scope.$watch('ngivrTemplateRaw', () => ngivrTemplateGenerator(), true);

     }
   }
  }

});
