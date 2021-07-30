ngivr.angular.directive('ngivrSweep', () => {
    return {
        restrict: 'E',
        scope: {
            direction: '@',
            userSite: '<'
        },
        templateUrl: 'components/ui/common/sweep/ngivr-sweep.html',
        controllerAs: '$ctrl',
        controller: function ($scope, ngivrConfirm, ngivrHttp, ngivrService, Auth, ngivrGrowl) {
            $scope.ngivr = ngivrService;
            $scope.model = {};

            $scope.isOpenStock = false;
            $scope.query = {
                search: {
                    $and: [
                        {
                            $or: [{ticketType: 'sweep'}, {ticketType: 'openStock'}],
                            direction: $scope.direction
                        },
                        {'site.siteId': $scope.userSite ? $scope.userSite._id : undefined}
                    ]
                }
            };

            $scope.saveSweep = (form) => {
                if (!$scope.ngivr.form.validate(form)) return;
                const object = {
                    partnerId: $scope.model.openStockValue === undefined ? $scope.model.partner._id : ngivr.settings.ownFirm,
                    productId: $scope.model.product._id,
                    depotId: $scope.model.depot._id,
                    fulfillmentDate: $scope.model.fulfillmentDate,
                    direction: $scope.direction,
                    quantity: $scope.model.quantity,
                    reason: $scope.model.reason,
                    createdBy: Auth.getCurrentUser(),
                    comments: [$scope.model.reason],
                    serviceContractId: $scope.model.serviceContract ? $scope.model.serviceContract._id : undefined,
                    openStockValue: $scope.model.openStockValue
                };

                ngivrConfirm('Biztosan menteni kívánja?', 'A mentés folyamatban').then(async function () {
                    try {
                        await ngivrHttp.post('api/depots/sweep/', object);
                        ngivrGrowl('A mentés sikeres volt');
                        $scope.model = {};
                        $scope.ngivr.form.clear(form)
                    } catch (e) {
                        if (e.data.message === 'noStockValue') {
                            ngivrGrowl('Hiba: A fellelt készlethez nincs átlagár, nem lehet bevételezni a mennyiséget!')
                        } else {
                            ngivrGrowl('Hiba: "' + e.data.message + '"')
                        }

                    }
                })
            };

            /**
             * Beállítja a formot nyitó készlet felvételéhez
             */
            $scope.setForm = () => {
                $scope.isOpenStock = !$scope.isOpenStock;
                if ($scope.isOpenStock) {
                    $scope.model.partner = undefined
                }
            }
        }
    }
});
