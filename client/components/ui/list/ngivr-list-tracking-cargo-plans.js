'use strict';
ngivr.angular.directive('ngivrListTrackingCargoPlans', (ngivrApi, $mdDialog) => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            loadNomination: '&',
            addNominationTab: '=',
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-tracking-cargo-plans.html',
        controller: function ($scope) {

            $scope.filter = {isClosed: 'notClosed'};
            $scope.origQuery = angular.copy($scope.ngivrQuery);

            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                $scope.inputSearch = undefined;
                $scope.filter.isClosed = 'notClosed'
            });

            this.search = (query) => {
                const search = $scope.inputSearch;
                let conditions = angular.copy($scope.origQuery.search.$and);
                if (search) {
                    conditions.push({
                        $or: [
                            {
                                'order.partner.name': {
                                    '$regex': search,
                                    '$options': 'i'
                                }
                            },
                            {
                                'contractName': {
                                    '$regex': search,
                                    '$options': 'i'
                                }
                            }
                        ]
                    })
                }
                query.search.$and = conditions;
                if ($scope.ngivrQuery.search.$and[0].transportType === 'truck') {
                    query.settings.isClosed = $scope.filter.isClosed;
                    if ($scope.filter.isClosed !== 'all') {
                        query.search.$and.push($scope.filter.isClosed === 'closed' ? {closed: true} : {closed: false})
                    }
                }
                query.sort = {'updatedAt': -1}
            };

            this.getContractRemain = (Id) => {
                ngivrApi.id('contract', Id).then(function (response) {
                    return response.data.doc.remain;
                })
            };

            this.deliveriesPopup = ($event, doc) => {
                // doc._id = cargoPlanId
                $event.stopPropagation();
                $mdDialog.show({
                    controller: 'NgivrListTrackingCargoPlansDeliveriesPopupController',
                    controllerAs: '$ctrl',
                    locals: {
                        ngivrListTrackingCargoPlansDeliveriesMdDialogDoc: doc
                    },
                    fullscreen: true,
                    templateUrl: 'components/ui/list/ngivr-list-tracking-cargo-plans-deliveries-popup.html',
                });

            };

            this.getCaption = (type) => {
                let caption = '';

                switch (type) {
                    case ngivr.strings.transportType.shipOn:
                        caption = ngivr.strings.button.newNominationReplace;
                        return caption.replace('{type}', ngivr.strings.nominationType.shipOn);

                    case ngivr.strings.transportType.truck:
                        caption = ngivr.strings.button.newNominationReplace;
                        return caption.replace('{type}', ngivr.strings.nominationType.truck);

                    case ngivr.strings.transportType.shipFrom:
                        caption = ngivr.strings.button.newNominationReplace;
                        return caption.replace('{type}', ngivr.strings.nominationType.shipFrom);

                }
            };

            this.getCargoType = (type) => {
                switch (type) {
                    case ngivr.strings.transportType.shipOn:
                        return ngivr.strings.nominationType.shipOn;

                    case ngivr.strings.transportType.truck:
                        return ngivr.strings.nominationType.truck;

                    case ngivr.strings.transportType.shipFrom:
                        return ngivr.strings.nominationType.shipFrom;

                }
            }
        }
    }
});
