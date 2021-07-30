'use strict';
ngivr.angular.directive('ngivrListTrackingContracts', (ngivrLockList, $filter) => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            addTab: '&',
            filter: '=',
            ngivrListSearchCallback: '&',
            calculateFreeToDispo: '&',
            ngivrFilename: '@',
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-tracking-contracts.html',
        controller: function ($scope, $state, ngivrOrder) {
            $scope.ngivrOrder = ngivrOrder;

            this.ngivrLockListInstance = ngivrLockList({
                scope: $scope,
                schema: 'contract',
                watch: 'docs',
                list: true
            });

            this.$scope = $scope;

            $scope.contractStatus = ['open'];

            $scope.fileNameAllContractButton = 'osszes-nyitott-szerzodes';
            $scope.tooltipAllContract = 'Összes nyitott szerződés letöltése';

            $scope.$watch('contractStatus', (newVal, oldVal) => {
                if (newVal !== oldVal) {
                    $scope.fileNameAllContractButton = 'osszes-';
                    $scope.tooltipAllContract = 'Összes ';
                    let query = {$or: []};
                    if (newVal && newVal.length) {
                        for (let status of newVal) {
                            switch (status) {

                                case 'closed':
                                    query.$or.push({closed: true});
                                    //$scope.ngivrQuery.search['$and'][15] = {closed: true};
                                    $scope.fileNameAllContractButton += 'lezart-';
                                    $scope.tooltipAllContract += 'lezárt, ';
                                    break;
                                case 'open':
                                    query.$or.push({
                                        contractStatus: {$ne: 'pTransferred'},
                                        closed: false
                                    });
                                    $scope.fileNameAllContractButton += 'nyitott-';
                                    $scope.tooltipAllContract += 'nyitott, ';
                                    //$scope.ngivrQuery.search['$and'][15] = {
                                    //     contractStatus: {$ne: 'pTransferred'},
                                    //     closed: false
                                    // };
                                    break;
                                case 'pTransferred':
                                    query.$or.push({contractStatus: 'pTransferred'});
                                    $scope.fileNameAllContractButton += 'tulajdonatruhazott-';
                                    $scope.tooltipAllContract += 'tulajdonátruházott, '
                                //$scope.ngivrQuery.search['$and'][15] = {contractStatus: 'pTransferred'}
                            }
                        }
                    } else {
                        query.$or = [{contractStatus: 'nincsIsIlyen'}]
                    }
                    $scope.fileNameAllContractButton += 'szerzodes';
                    $scope.tooltipAllContract = $scope.tooltipAllContract.slice(0, -2);
                    $scope.tooltipAllContract += ' szerződés letöltése. ';
                    $scope.ngivrQuery.search['$and'][15] = query;
                    ngivr.list.requery($scope);
                    $scope.allQuery.search.$and[15] = query;
                }
            });

            $scope.$watch('ngivrQuery', (newVal, oldVal) => {
                $scope.allQuery = angular.copy(newVal);

                $scope.allQuery.search.$and[6] = {$and: [{$or: [{buy: true}, {buy: false}]}]};
                //$scope.allQuery.search.$and[15] = {};//
                if ($scope.allQuery.settings) {
                    $scope.allQuery.settings.allContracts = true
                }

            }, true);

            $scope.subscribe('filterChanged', (search) => {
                $scope.allQuery.search = angular.copy(search);
                $scope.allQuery.search.$and[6] = {$and: [{closed: false}, {$or: [{buy: true}, {buy: false}]}]};
                $scope.allQuery.search.$and[15] = {};
                if ($scope.allQuery.settings) {
                    $scope.allQuery.settings.allContracts = true
                }
            });

            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                $scope.ngivrQuery.search['$and'][0].$or[0]['partner.name']['$regex'] = "";
                //$scope.ngivrQuery.search['$and'][15] = {closed: false};
                $scope.contractStatus = ['open'];
                $scope.publish('contractListQueryCleared')
            });

            $scope.$on(ngivr.settings.event.client.list.loaded, async (data) => {
                $scope.docs = data.targetScope.query.docs;
            });

            Object.defineProperty($scope, 'searchValue', {
                get: () => {
                    return $scope.ngivrQuery.search['$and'][0].$or[0]['partner.name']['$regex'];
                },
                set: (value) => {
                    for (let index in $scope.ngivrQuery.search['$and'][0].$or) {
                        for (let key in $scope.ngivrQuery.search['$and'][0].$or[index]) {
                            $scope.ngivrQuery.search['$and'][0].$or[index][key]['$regex'] = value;
                            break;
                        }
                    }
                    ngivr.list.requery($scope);
                }
            });

            /**
             * Megfelelő state-re irányít, attól függően, hogy vételi vagy
             * eladási szerződésről van szó
             * @param id
             * @param buy
             */
            $scope.goToState = (id, buy) => {
                if (buy) {
                    $state.go('tracking.contracts.buy.detail', {id: id, buy: buy})
                } else {
                    $state.go('tracking.contracts.sell.detail', {id: id, buy: buy})
                }
            };

            // /**
            //  * Diszponálható mennyiség meghatározása
            //  * @param contract
            //  * @returns {number}
            //  */
            // $scope.getQuantityToDispo = (contract) => {
            //   let orderQuantity = 0;
            //   let planQuantity = 0;
            //   let possessionTransferQuantity = 0;
            //   if (contract.reserved) {
            //     //let orderQuantity = 0;
            //     //let planQuantity = 0;
            //     for (let i in contract.reserved.orders) {
            //       orderQuantity += contract.reserved.orders[i].weight; //- contract.reserved.orders[i].performed
            //     }
            //     for (let i in contract.reserved.plans) {
            //       planQuantity += contract.reserved.plans[i].weight
            //     }
            //     for (let i in contract.reserved.possessionTransfers) {
            //       possessionTransferQuantity += contract.reserved.possessionTransfers[i].weight
            //     }
            //   }
            //   let max = contract.quantity +  contract.quantity * contract.percentPlusValue / 100
            //   return $filter('number')(max - orderQuantity - planQuantity - possessionTransferQuantity)
            // }

            this.search = () => {
                const $scope = this.$scope;
            };

            this.show = () => {
                alert('show');
            };

            this.isContractLocked = (contract) => {
                return this.ngivrLockListInstance.isDocumentLocked({
                    doc: contract
                })
            };

        }
    }
});
