'use strict';
ngivr.angular.directive('ngivrListDepots', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            productsSum: '=',
            depots: '=',
            ngivrUrl: '<',
            selectedSitePartner: '=',
            selectedProduct: '=',
            site: '<'
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-depots.html',
        controller: function ($scope, $mdMedia) {
            this.$scope = $scope;
            this.$scope.selectedDepot = false;

            this.$scope.selectDepot = (depot) => {
                console.log(depot);
                depot.clicked = !depot.clicked;
                this.$scope.selectedDepot = !this.$scope.selectedDepot;
            };
            this.$scope.deSelectDepot = () => {
                this.$scope.selectedDepot = null;
            };
            this.$scope.$on('$destroy', async () => {
                //alert('depot-list destroyed')

            });

            $scope.$mdMedia = $mdMedia;

            $scope.filename = `${$scope.site ? $scope.site.name : 'ITK'}`;

            // $scope.setFileName = () => {
            //     $scope.filename = `${$scope.site ? $scope.site.name : 'ITK'}${$scope.selectedProduct ? '-'+$scope.selectedProduct.name : ''}`
            // };
            //
            // $scope.$watch('selectedProduct', (newVal, oldVal) => {
            //     $scope.setFileName()
            // })

            $scope.sort = {
                position: 'before',
                items: [
                    {
                        key: 'freeCapacity',
                        display: 'Szabad kapacitás',
                        sort: {

                            // ez mindig statikus, soha nem változik
                            //createdAt: -1,
                            // ebben a gui dönt
                            //'fulfillmentDate': true,
                            // ebben a gui dönt
                            'freeCapacity': true,
                        },

                    },
                    {
                        key: 'depotName',
                        display: 'Raktárnév',
                        sort: {

                            // ez mindig statikus, soha nem változik
                            //createdAt: -1,
                            // ebben a gui dönt
                            //'fulfillmentDate': true,
                            // ebben a gui dönt
                            '_id.depotName': true,
                        },

                    }
                ]
            };

            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                $scope.inputSearch = undefined;
                $scope.selectedSitePartner = null;
                $scope.selectedProduct = null;
                $scope.depot = undefined
            });

            $scope.$watch('depot', (newVal, oldVal) => {
                $scope.publish('selectDepot', newVal ? newVal._id : undefined)
            });

            // if ($scope.depot) {
            //     $scope.publish('selectDepot', $scope.depot._id)
            // }

            $scope.depotQuery = $scope.ngivrQuery;

            $scope.subscribe('depotSortChanged', (sort) => {
                $scope.depotQuery.sort = sort
            });

            this.search = (query) => {
                //console.log(query);
                //const $scope = this.$scope;
                /*const search = $scope.inputSearch;
                query.search = {
                  contract: true,
                  deletedOffer: false,
                  buy: $scope.ngivrQuery.search.buy,
                  'owner.0.name': $scope.currentUser.name,
                  $or: [
                    {
                      'partner.name': {
                        '$regex':  search,
                        '$options': 'i'
                      }
                    },
                    {
                      'contractNumber': {
                        '$regex':  search,
                        '$options': 'i'
                      }
                    },
                    {
                      'partnerContractNumber': {
                        '$regex':  search,
                        '$options': 'i'
                      }
                    }
                  ]

                };
                query.sort = {'updatedAt' : -1}
                */
            };

            this.loadDepot = (depot) => {
                this.$scope.publish('loadDepot', depot)
            }
        }
    }
});
