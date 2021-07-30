'use strict';
ngivr.angular.directive('ngivrButtonPdfExistingPopup', (ngivrService, ngivrException, ngivrHttp, ngivrPdfPopup, $timeout, socket) => {
    const service = ngivrService;

    return {
        controllerAs: '$ctrl',
        restrict: 'E',
        scope: {
            ngivrSchema: '@',
            ngivrId: '@',
            ngivrButton: '<?',
            ngivrTemplate: '@',
            ngivrLabel: '@',
            ngivrStyle: '@'
        },
        template: `
<div ng-if="!ngivrButton">
    <ngivr-icon-fa ngivr-tooltip="{{ngivrLabel}}" style="{{ngivrStyle}}" ngivr-icon-fa="fa-file-pdf-o" ng-click="disabled || $ctrl.openPdf($event)" ng-disabled="disabled"/>
</div>
<div ng-if="ngivrButton">
    <ngivr-button ng-click="disabled || $ctrl.openPdf()" ng-disabled="disabled">
        <ng-md-icon icon="picture_as_pdf"></ng-md-icon>
        <md-tooltip>{{ngivrLabel}}</md-tooltip>
        {{ngivrLabel}}
    </ngivr-button>
</div>
`,

        controller: function ($scope) {
            if ($scope.ngivrLabel === undefined) {
                $scope.ngivrLabel = 'Meglévő PDF Nyomtatás'
            }
            //  console.log($scope.ngivrSchema, $scope.ngivrId)
            $scope.disabled = true;
            const self = this;

            const onInit = async () => {
                try {
                    //console.warn('ngivrButtonPdfExistingPopup', $scope.ngivrSchema, $scope.ngivrId)
                    const response = await ngivrHttp.get(`api/pdfDocuments/download/${$scope.ngivrSchema}/${$scope.ngivrId}/true/${$scope.ngivrTemplate}`);
                    $scope.disabled = response.data.count < 1
                } catch (e) {
                    ngivrException.handler(e)
                }
            };

            $timeout(onInit);

            const data = [];
            const schemaCamelCase = _.camelCase($scope.ngivrSchema);
            socket.syncUpdates($scope, 'PdfFile', data, function (event, item, object) {
                if (item.docType !== schemaCamelCase || item.docId !== $scope.ngivrId) {
                    return;
                }
                if (typeof $scope.ngivrTemplate === 'string' && $scope.ngivrTemplate.length > 0) {
                    if (item.pdfTemplate !== $scope.ngivrTemplate) {
                        return
                    }
                }
                switch (event) {
                    case  'deleted':
                        $scope.disabled = true;
                        break;

                    case 'created':
                        $scope.disabled = false;
                }
            });

            self.openPdf = async (ev) => {
                if (ev !== undefined) {
                    ev.stopImmediatePropagation();
                }
                try {
                    //console.warn('ngivrButtonPdfExistingPopup', $scope.ngivrSchema, $scope.ngivrId)
                    const response = await ngivrHttp.get(`api/pdfDocuments/download/${$scope.ngivrSchema}/${$scope.ngivrId}/false/${$scope.ngivrTemplate}`);

                    const url = `${location.origin}/api/pdfDocuments/download/${response.data.pdfFile._id}/${$scope.ngivrTemplate}`
                    if (ngivr.isElectron()) {
                        window.open(url);
                        return;
                    }
                    //console.warn( data)
                    ngivrPdfPopup.showBase64Buffer({
                        data: url,
                        ngIcon: 'attachment',
                        title: ngivrService.strings.button.pdf
                    })
                } catch (e) {
                    ngivrException.handler(e)
                }

            }

        }
    }
});
