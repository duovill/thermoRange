'use strict';
ngivr.angular.directive('ngivrViewHtmlTemplatePdf', function (ngivrService, ngivrTemplatePdf, ngivrButtonPdfShared, $sce, $timeout) {

    const service = ngivrService;

    return {
        controllerAs: '$ctrl',
        restrict: 'E',
//    require: 'ngModel',
//    transclude: true,
        scope: {
            ngivrType: '@',
            ngivrTemplateRaw: '<',
            ngivrData: '<',
            ngivrTemplates: '<',
        },
        template: `<iframe src="{{ data }}" frameborder="0" style="min-height: 400px; width: 100%; height: 100%; resize: vertical" ></iframe>`,
        controller: function ($scope) {

            const init = async () => {
                let templatePdf;

                let loading = false;
                const start = async () => {
                    try {
                        loading = true;
                        templatePdf = new ngivrTemplatePdf({
                            template: $scope.ngivrTemplate,
                            templateRaw: $scope.ngivrTemplateRaw,
                            templates: $scope.ngivrTemplates,
                        })

                        await templatePdf.generator.boot();
                        $scope.templatePdf = templatePdf;
                        this.preview = new ngivrButtonPdfShared($scope, templatePdf).preview;
                        const raw = await this.preview(true);
                        $scope.data = $sce.trustAsResourceUrl(raw);
                    } catch (e) {
                        ngivr.growl.error(e);
                    } finally {
                        loading = false;
                    }
                }
                start();
                let waitTimeout;

                const newUpdate = function (newValue, oldValue) {
                    //console.log(arguments)
                    const load = () => {
                        $timeout.cancel(waitTimeout)
                        waitTimeout = $timeout(async () => {
                            if (loading) {
                                load();
                                return;
                            }
                            await start();
                        }, 1000)
                    }
                    load();
                }

                $scope.$watch('ngivrTemplateRaw', newUpdate);
                $scope.$watch('ngivrData', newUpdate);
                $scope.$watch('ngivrTemplates', newUpdate);
            }
            init();


        }
    }

});
