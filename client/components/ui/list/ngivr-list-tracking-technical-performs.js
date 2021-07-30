'use strict';
ngivr.angular.directive('ngivrListTrackingTechnicalPerforms', () => {
    return {
        restrict: 'E',
        scope: {
            contractId: '<'

        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-tracking-technical-performs.html',
        controller: function ($scope) {
            $scope.ngivrUrl = '/api/tickets/tickets-by-possession-transfers/' + $scope.contractId;
            this.$scope = $scope;

            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                $scope.inputSearch = undefined;
            });

            $scope.detailedPTransfers = [];

            /**
             * a $scope.detailedInvoices tömbben tároljuk azoknak az számláknak az id-ját,
             * amelyeknél mutatjuk a részleteket
             * @param id
             */
            $scope.showItems = (id) => {
                if ($scope.detailedPTransfers.includes(id)) {
                    $scope.detailedPTransfers.splice($scope.detailedPTransfers.indexOf(id), 1)
                } else {
                    $scope.detailedPTransfers.push(id)
                }
            };

            this.search = (query) => {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                query.search = {
                    ticketType: 'scale',
                    'partner.name': {
                        '$regex': search,
                        '$options': 'i'
                    },
                    'contractName': {
                        '$regex': search,
                        '$options': 'i'
                    }

                };
                query.sort = {'updatedAt': -1}
            };

            this.show = () => {
                alert('show');
            }
        }

    }
});
