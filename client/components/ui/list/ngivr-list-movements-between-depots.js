'use strict';
ngivr.angular.directive('ngivrListMovementsBetweenDepots', () => {
    return {
        restrict: 'E',
        scope: {
            //ngivrQuery: '=',
            ticketSelected: '=',
            showFilter: '<'
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-movements-between-depots.html',
        controller: function ($scope, Auth, ngivrPrompt, ngivrHttp, ngivrException) {
            this.$scope = $scope;
            $scope.ngivrQuery = {sort: {fulfillmentDate: -1}};
            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                $scope.inputSearch = undefined;

            });

            $scope.sort = {
                position: 'before',
                items: [
                    {
                        key: 'fulfillmentDate',
                        display: 'Teljesítés',
                        sort: 'fulfillmentDate'
                    }
                ]
            };

            $scope.deleteMovement = async (doc) => {
                try {
                    let currentUser = Auth.getCurrentUser();

                    let reason = await ngivrPrompt({
                        title: 'Raktárak közti mozgatás törlése',
                        textContent: 'Kérem, adja meg a törlés okát!',
                        placeholder: 'Törlés oka',
                        ariaLabel: 'Törlés',
                        initialValue: undefined
                    });

                    for (let ticket of doc.tickets) {
                        ticket.delete = {
                            reason: reason,
                            date: new Date(),
                            userId: currentUser._id,
                            userName: currentUser.fullName
                        };
                        ticket.deleted = true;
                    }



                    let resp = await ngivrHttp.put('api/depots/rollBackMoveProductOfPartner/' + doc.tickets[0]._id, doc);
                    ngivr.growl('Sikeres törlés')
                } catch (error) {
                    ngivrException.handler(error);
                }

            }

            this.search = (query) => {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                let conditions = [];
                let inputSearch;
                if ($scope.inputSearch) {
                    inputSearch = {
                        $or: [
                            {
                                'productName': {
                                    '$regex': search,
                                    '$options': 'i'
                                }
                            },
                            {
                                'owners.name': {
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
                                'depot.0.site.name': {
                                    '$regex': search,
                                    '$options': 'i'
                                }
                            },
                        ]
                    };
                    conditions.push(inputSearch)
                }

                if (conditions.length > 0) {
                    query.search = {$and: conditions};
                } else {
                    query.search = $scope.ngivrQuery.search;
                }
            }
        }
    }
});
