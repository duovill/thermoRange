'use strict';
ngivr.angular.directive('ngivrListTrackingTickets', () => {
  return {
    restrict: 'E',
    scope: {
      contractId: '<'

    },
    controllerAs: '$ctrl',
    templateUrl: 'components/ui/list/ngivr-list-tracking-tickets.html',
    controller: function ($scope) {
        $scope.ngivrUrl =  '/api/tickets/tickets-of-contract/' + $scope.contractId;
        this.$scope = $scope;

        // ha torles van, akkor igy kell hasznalni (ures lesz minden)
        $scope.$on(ngivr.settings.event.client.list.clear, () => {
            $scope.inputSearch = undefined;
        });

        this.search = (query) => {
            const $scope = this.$scope;
            const search = $scope.inputSearch;
            query.search = {
                ticketType: 'scale',
                'partner.name': {
                    '$regex':  search,
                    '$options': 'i'
                },
                'contractName': {
                    '$regex':  search,
                    '$options': 'i'
                }

            };
            query.sort = {'updatedAt' : -1}
        };

        this.show = () => {
            alert('show');
        }
    }

  }
});
