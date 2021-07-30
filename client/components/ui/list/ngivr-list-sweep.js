'use strict';
ngivr.angular.directive('ngivrListSweep', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            loadNomination: '&',
            addNominationTab: '=',
            userSite: '<'
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-sweep.html',
        controller: function ($scope, $window, ngivrConfirm, ngivrPrompt, ngivrHttp) {
            this.$scope = $scope;

            if ($scope.userSite) {
                $scope.site = $scope.userSite;
            }
            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                $scope.ticketName = undefined;
                $scope.fulfillmentDate = undefined;
                $scope.product = undefined;
                $scope.owner = undefined;
                $scope.depot = undefined;
                if (!$scope.userSite) {
                    $scope.site = undefined;
                }
            });

            $scope.deleteTicket = async (ticket) => {
                ngivrConfirm('Biztosan törli?').then(async () => {
                    ticket.comments[1] = await ngivrPrompt({
                        title: 'Készlet mozgás törlése',
                        textContent: 'Kérem, adja meg a törlés okát!',
                        placeholder: 'Törlés oka',
                        ariaLabel: 'Törlés',
                        initialValue: undefined
                    });
                    const ticketToDelete = angular.copy(ticket);
                    ticketToDelete.deleted = true;


                    await ngivrHttp.put('api/tickets/' + ticket._id, ticketToDelete);

                    ngivrGrowl('A törlés sikeres volt');
                });


            };
            $scope.$watch('fulfillmentDate', (newVal) => {
                // console.log("Query was built");
                if (newVal) {
                    $scope.ngivrQuery.search.fulfillmentDate = {$eq: new Date(newVal)}
                } else if ($scope.ngivrQuery.search.fulfillmentDate) {
                    delete $scope.ngivrQuery.search.fulfillmentDate
                }
                this.search($scope.ngivrQuery);
                ngivr.list.requery($scope);

            });

            this.$id = $scope.$id;
            this.topOffset = $window.innerWidth < 1000 ? 0 : 73;

            this.search = (query) => {
                const $scope = this.$scope;
                // const s = $scope.textSearch;
                let conditions = [];

                if ($scope.ticketName) {
                    conditions.push({
                        'ticketName': {
                            $regex: $scope.ticketName,
                            $options: 'i'
                        }
                    })
                }

                if ($scope.product) {
                    conditions.push({
                        'productId': {
                            $eq: $scope.product._id
                        }
                    })
                }

                if ($scope.owner) {
                    conditions.push({
                        'ownerId': {
                            $eq: $scope.owner._id
                        }
                    });
                }


                if ($scope.site) {
                    conditions.push({
                        'site.siteId': {
                            $eq: $scope.site._id
                        }
                    })
                }

                if ($scope.depot) {
                    conditions.push({
                        'depot.depotId': {
                            $eq: $scope.depot._id
                        }
                    })
                }

                if ($scope.ticketName) {
                    query.search.ticketName =
                        {
                            $regex: $scope.ticketName,
                            $options: 'i'
                        }
                }

                if (conditions.length > 0) {
                    conditions.push(this.$scope.ngivrQuery.search)
                    query.search = {$and: conditions}
                } else {
                    query.search = this.$scope.ngivrQuery.search;
                }
            }
        }
    }
});
