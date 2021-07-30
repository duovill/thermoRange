'use strict';

ngivr.angular.directive('ngivrMoveProductsPartners', () => {
    return {
        restrict: 'E',
        scope: {
            ngModel: '=',
            userSite: '<'
        },
        templateUrl: 'components/ui/common/move/ngivr-move-products-partners.html',
        controllerAs: '$ctrl',
        controller: class {
            constructor($scope, ngivrHttp, ngivrConfirm, ngivrService, ngivrGrowl) {
                $scope.ngivr = ngivrService;
                $scope.Math = window.Math;
                $scope.model = {};

                /**
                 * Lekéri adott site, és termény alapján a Sygnusos készletet, raktáranként és terményenként csoportosítva
                 * @param options
                 * @returns {Promise.<void>}
                 */
                $scope.getDepots = async (options) => {
                    if ($scope.model.srcPartner || $scope.model.product) {
                        let query = {
                            partnerId: $scope.model.srcPartner ? $scope.model.srcPartner._id : options.partnerId,
                            siteId: $scope.userSite ? $scope.userSite._id : undefined,
                            productId: $scope.model.product ? $scope.model.product._id : options.productId,
                            serviceContractId: $scope.model.sourceServiceContract ? $scope.model.sourceServiceContract._id : options.serviceContractId
                        };
                        ngivrHttp.get('api/depots//getDepotsByParameters/', {params: query}).then((response) => {
                            $scope.model.depotsWithProduct = response.data.depots;
                        })
                    } else {
                        $scope.model.depotsWithProduct = []
                    }
                };

                /**
                 * Mentés, a kívánt mennyiségek átadása másik partnernek
                 * @param form
                 */
                $scope.moveProducts = (form) => {
                    if (!$scope.ngivr.form.validate(form)) return;
                    let object = {
                        srcPartnerId: $scope.model.srcPartner._id,
                        dstPartnerId: $scope.model.dstPartner._id,
                        productId: $scope.model.product._id,
                        storageList: [],
                        fulfillmentDate: $scope.model.fulfillmentDate,
                        sourceServiceContractId: $scope.model.sourceServiceContract._id,
                        actualServiceContractId: $scope.model.actualServiceContract._id
                    };
                    for (let depot of $scope.model.depotsWithProduct) {
                        if (depot.amount) object.storageList.push({depotId: depot._id.depotId, amount: depot.amount})
                    }
                    if (!object.storageList.length) {
                        ngivrGrowl('Nem adott meg mennyiséget!');
                        return
                    }
                    ngivrConfirm('Biztosan menteni kívánja?', 'A mentés folyamatban').then(async function () {
                        try {
                            await ngivrHttp.post('api/tickets//move-product-between-partners/', object);
                            $scope.ngivr.form.clear(form);
                            ngivrGrowl('A mentés sikeres volt');
                            $scope.model = {};
                        } catch (e) {
                            ngivrGrowl('Hiba: "' + e.data.message + '"')
                        }
                    })
                }
            }
        }
    };
});
