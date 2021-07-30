'use strict';
ngivr.angular.directive('ngivrListTrackingPossessionTransfers', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            loadPossessionTransferFromTabList: '&',
            loadPossessionTransferFromList: '&',
            tabQuery: '=',
            contractId: '<?'
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-tracking-possession-transfers.html',
        controller: function ($scope, $state, ngivrService) {
            this.$scope = $scope;
            this.$state = $state;
            this.service = ngivrService;
            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                $scope.inputSearch = undefined;
            });

            /**
             * Az egyes birtokátruházók mennyiségét kalkulálja, a ledgerek alapján
             * @param doc
             * @returns {number}
             */
            $scope.getQuantity = (doc) => {
                let quantity = 0;
                for (let ledger of doc.ledger) {
                    quantity += ledger.loadedWeight
                }
                return quantity
            };

            this.search = (query) => {
                const $scope = this.$scope;
                const search = $scope.inputSearch;
                if ($scope.contractId) {
                    query.search = //{
                        //     $and: [
                        //         {ticketType: 'possessionTransfer'},
                        //         {sygnus: true},
                        //         {'contract.partner.0.name': undefined},
                        //         {'productName': undefined},
                        //         {'contract.product.0.productGroupName': undefined}
                        //     ]
                        // }





                        {
                            ticketType: 'possessionTransfer',
                            contractId: $scope.contractId,
                            $or: [
                                {
                                    'ticketName': {
                                        '$regex': search,
                                        '$options': 'i'
                                    }
                                }
                            ]


                        };
                    query.sort = {'updatedAt': -1}
                } else {
                    query.search = {
                        $and: [
                            {ticketType: 'possessionTransfer'},
                            {sygnus: true},

                        ],
                        $or: [
                            {'contract.partner.0.name': {
                                    '$regex': search,
                                    '$options': 'i'
                                }},
                            {'productName': {
                                    '$regex': search,
                                    '$options': 'i'
                                }},
                            {'contract.product.0.productGroupName': {
                                    '$regex': search,
                                    '$options': 'i'
                                }},
                            {'ticketName': {
                                    '$regex': search,
                                    '$options': 'i'
                                }}
                        ]
                    }
                }

            };

            this.show = () => {
                alert('show');
            };

            /**
             * Új tabra betölti a birtokátruházót
             * @param possessionTransfer
             * @param side
             * @param $event
             */
            this.loadPossessionTransfer = (possessionTransfer, side, $event) => {
                const $scope = this.$scope;
                $scope.loadPossessionTransferFromList({
                    possessionTransfer: possessionTransfer,
                    side: side,
                    $event: $event
                });
                $scope.loadPossessionTransferFromTabList(({
                    possessionTransfer: possessionTransfer,
                    side: side,
                    $event: $event
                }))
            };

            /**
             * Birtokátruházó listaelemre kattintva betölti a birtokátruházót a saját tab-ra
             * @param doc
             */
            this.showPossessionTransfer = (doc) => {
                if (this.$scope.$parent.tab) {
                    //alert(this.$state.current.name)
                    //this.$scope.$parent.tab.stored = doc

                    this.service.api.id('depot', doc.depot.depotId).then((response) => {
                        const depot = response.data.doc;
                        this.$scope.$parent.tab.stored = {
                            volume: doc.ledger[0].loadedWeight,
                            number: doc.ticketName,
                            depot: depot,
                            //depotId: depot._id,
                            feeStartDate: this.$scope.$parent.convertDate(doc.possessionTransfer.feeStartDate),
                            fulfillmentDate: this.$scope.$parent.convertDate(doc.fulfillmentDate),
                            loaded: true
                        };
                        if (this.$scope.$parent.tab.content.buy) {
                            this.$scope.$parent.tab.stored.dueDate = this.$scope.$parent.convertDate(doc.possessionTransfer.dueDate);
                            this.$scope.$parent.tab.stored.fee = doc.possessionTransfer.fee;
                            this.$scope.$parent.tab.stored.currency = doc.possessionTransfer.currency;
                            this.$scope.$parent.tab.stored.feeType = doc.possessionTransfer.feeType;
                        } else {
                            this.$scope.$parent.tab.stored.serviceContract = doc.ledger[0].serviceContractId;
                        }
                        this.$scope.$parent.showPossessionTransferForm[this.$scope.$parent.$index] = true
                    });
                }

            }
        }

    }
});
