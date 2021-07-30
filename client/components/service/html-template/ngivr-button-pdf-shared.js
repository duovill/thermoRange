'use strict';
ngivr.angular.factory('ngivrButtonPdfShared', function ($mdDialog, $timeout, ngivrPdfPopup, ngivrService, socket) {

    return function ($scope, templatePdf) {
        this.preview = async (raw = false) => {
            let data;
//      if ($scope.url === undefined) {
            $scope.ngivrTemplateRaw.copies = $scope.copies || $scope.ngivrTemplateRaw.copies;
            $scope.ngivrTemplateRaw.language = $scope.language || $scope.ngivrTemplateRaw.language;
            const response = await templatePdf.generate({
                dataRaw: $scope.ngivrData,
                template: $scope.ngivrTemplate,
                templateRaw: $scope.ngivrTemplateRaw,
                save: false,
                additionalTemplates: !Array.isArray($scope.ngivrAdditionalTemplates)  ? [] : $scope.ngivrAdditionalTemplates ,
                additionalTemplatesRaw: $scope.additionalTemplatesRaw,
            });
//console.log(response);
            data = response.data.pdfBase64;
            //console.warn(data)
//console.log(data);
            if (raw) {
                return data;
            }
//      } else {
//        data = $scope.url;
//      }

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
                ngIcon: 'pageview',
                title: ngivrService.strings.button.preview
            })

        }
    };
});
