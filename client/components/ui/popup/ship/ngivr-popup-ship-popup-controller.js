const NgivrPopupShipPopupController = function (ship, $scope, $mdDialog, ngivrHttp, ngivrException, ngivrService, ngivrApi, ngivrPdfModelGenerator) {
    const start = async () => {
$scope.model = ship

        const shipId = ngivrService.data.id({
            schema: 'ship',
            id: ship._id,
            $scope: $scope,
            subscribe: async (promise) => {
                try {
                    const response = await promise;

                    if (response.data !== undefined && ship._id === response.data.doc._id) {
                        $scope.expandedData = Object.assign({}, response.data.doc);
                        $scope.model = $scope.expandedData;
                    } else if (ship._id === response._id) {
                        $scope.expandedData = Object.assign({}, response);
                        $scope.model = $scope.expandedData;
                    }
                } catch (e) {
                    ngivr.growl.error(e);
                }
            }
        });
        $scope.isClosed = ship.isClosed;
        $scope.selectedShipQuery = {
            //sort: {updatedAt: -1},
            search: {
                'ship._id': ship._id,
                direction: 'out'
            }
        };

        $scope.closeShipWindow = () => {
            $scope.showShip = false
        };

        $scope.cancel = function (beforeCancel) {
            if (beforeCancel !== undefined) {
                $scope[beforeCancel]($scope.doc)
            }
            $mdDialog.cancel();
        };

        ngivrPdfModelGenerator($scope, 'shipPaper', 'shipPaper', 'shipPaperToPrint');

        $scope.setShipPaper = async (ship = $scope.model) => {
            let paperResponse = await ngivrHttp.post('/api/shipPapers/', {shipId: ship._id});
            $scope.shipPaper = paperResponse.data;
        };

        if ($scope.model.isClosed) {
            await $scope.setShipPaper()
        }

        $scope.closeShip = async function (isClosed, ship) {
            try {
                ship.isClosed = isClosed;
                if (ship.pdfUrl) ship.pdfUrl = null;
                let resp = await ngivrApi.save('ship', $scope.model);
                ship = resp.data.doc;
                await $scope.setShipPaper(ship)
                // let paperResponse = await ngivrHttp.post('/api/shipPapers/', {shipId: ship._id});
                // $scope.shipPaper = paperResponse.data;

                // $scope.shipPaper = paperResponse.data;
                // resp = await $http.put('/api/ships/' + ship._id, ship).then(async function (response) {
                //     ship = response.data;
                //     let paperResponse = await ngivrHttp.post('/api/shipPapers/', {shipId: ship._id});
                //     $scope.shipPaper = paperResponse.data;
                // })
            } catch (e) {
                if (e !== undefined) {
                    ngivrException.handler(e)
                }
            }

        };
    }
    start()
};
    NgivrPopupShipPopupController.$inject = ['ship', '$scope', '$mdDialog', 'ngivrHttp', 'ngivrException', 'ngivrService', 'ngivrApi', 'ngivrPdfModelGenerator'];
