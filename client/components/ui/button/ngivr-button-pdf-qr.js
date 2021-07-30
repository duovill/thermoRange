'use strict';
ngivr.angular.directive('ngivrButtonPdfQr', (ngivrService, ngivrTemplatePdf, ngivrException, ngivrPdfPopup, $http) => {
    const service = ngivrService;

    return {
        controllerAs: '$ctrl',
        restrict: 'E',
        scope: {
            ngivrTemplate: '@',
            ngivrData: '<',
            ngivrStyle: '<'
        },
        template: `
<ngivr-button ng-click="$ctrl.generateQrPdf($event)" ng-show="templateRaw !== undefined" ngivr-style="ngivrStyle">
    <i class="fa fa-qrcode"></i> {{ templateRaw.label }}
</ngivr-button>
`,

        controller: function ($scope) {
            //console.warn('ngivrButtonPdfQr', $scope.style)
            $scope.templateRaw = undefined

            const start = async() => {
                try {
                    const response = await $http({
                        url: '/data/HtmlTemplate/query',
                        method: 'post',
                        data: {
                            search: {
                                partialName: $scope.ngivrTemplate
                            }
                        }
                    })
                    if (response.data.docs.length !== 1) {
                        throw new Error(`Nincsen ilyen QR sablon: ${$scope.ngivrTemplate} - ngivrButtonPdfQr`)
                    }
                    $scope.templateRaw  = response.data.docs[0];
                } catch(e) {
                    ngivrException.handler(e)
                }
            }
            start()


            this.generateQrPdf = async ($event) => {
                try {
                    $event.stopPropagation();

                    const templatePdf = new ngivrTemplatePdf({
                        templateRaw: $scope.templateRaw ,
                    })
                    //console.warn('generateQrPdf', $scope.ngivrData, templateRaw)

                    const pdfRequest = {
                        dataRaw:  $scope.ngivrData,
                        templateRaw: $scope.templateRaw ,
                        save: false,
                    };
                    const result  = await templatePdf.generate(pdfRequest)

                    const data = result.data.pdfBase64
                    if (ngivr.isElectron()) {
                        socket.c2c({
                            action: 'pdf-preview',
                            data: {
                                base64: data
                            },
                        })
                        //window.open(data);
                        return;
                    }

                    ngivrPdfPopup.showBase64Buffer({
                        data: data,
                        ngIcon: 'picture_as_pdf',
                        title: $scope.templateRaw.label
                    })
                } catch(e) {
                    ngivrException.handler(e)
                }
            }
        }
    }
});
