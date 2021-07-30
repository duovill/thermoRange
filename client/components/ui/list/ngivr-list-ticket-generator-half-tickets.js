'use strict';
ngivr.angular.directive('ngivrListTicketGeneratorHalfTickets', (ngivrConfirm, ngivrApi) => {
  return {
    restrict: 'E',
    scope: {
      ngivrQuery: '=',
      halfTicketSelected : '=',
    },
    controllerAs: '$ctrl',
    templateUrl: 'components/ui/list/ngivr-list-ticket-generator-half-tickets.html',
    controller: function ($scope, $rootScope) {
        this.$scope = $scope;

        // ha torles van, akkor igy kell hasznalni (ures lesz minden)
        $scope.$on(ngivr.settings.event.client.list.clear, () => {
            $scope.inputSearch = undefined;
        });

        this.search = (query) => {
            const $scope = this.$scope;
            const search = $scope.inputSearch;
            query.search = {
                $or: [
                    {
                        'productName': {
                            '$regex': search,
                            '$options': 'i'
                        }
                    },
                    // {
                    //     'ship.name': {
                    //         '$regex': search,
                    //         '$options': 'i'
                    //     }
                    // },
                    {
                        'ownerName': {
                            '$regex': search,
                            '$options': 'i'
                        }
                    },
                    {
                        'depot.name': {
                            '$regex': search,
                            '$options': 'i'
                        }
                    },
                    {
                        'plateNumber1': {
                            '$regex': search,
                            '$options': 'i'
                        }
                    },
                    {
                        'plateNumber2': {
                            '$regex': search,
                            '$options': 'i'
                        }
                    }
                ],
                deleted: false,
                weighingHouse: $rootScope.weighingHouse._id
            };
            query.sort = {'updatedAt' : -1}
        }



        /**
         * HalfTicket törlése
         */
        this.deleteHalfticket =  (doc, $event) => {
            if ($event !== undefined) {
                $event.stopImmediatePropagation();
            }
            ngivrConfirm('Biztosan törli a mérést?').then(() => {
                doc.deleted = true;
                ngivrApi.save('halfTicket', doc)
            })
        };
    }


  }
});

