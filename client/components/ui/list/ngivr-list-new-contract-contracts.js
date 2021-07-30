'use strict';
ngivr.angular.directive('ngivrListNewContractContracts', (ngivrLockList) => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',
            loadContract: '&'
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-new-contract-contracts.html',
        controller: function ($scope, ngivrOrder) {
            this.ngivrLockListInstance = ngivrLockList({
                scope: $scope,
                schema: 'contract',
                watch: 'docs',
                list: true,
                onUnlock: (options) => {
                },
                onAutoUnlockOrError: (options) => {
                    $scope.publish('unloadContract')
                }
            });
            $scope.ngivrOrder = ngivrOrder;
            this.$scope = $scope;

            $scope.unlockContract = async (doc) => {
                try {
                    await this.ngivrLockListInstance.unlockDocument({doc: doc})
                } catch (e) {
                    console.warn(e)
                }

            };

            $scope.subscribe('contractUnloaded', async (doc) => {
                await $scope.unlockContract(doc)
            });

            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            ngivr.event.on.list.clear($scope, () => {
                $scope.inputSearch = undefined;
                $scope.status = 1;
            });

            $scope.$on(ngivr.settings.event.client.list.loaded, async (data) => {

                $scope.docs = data.targetScope.query.docs;

            });

            $scope.loadContractFromList = async (doc) => {
                if (!await this.ngivrLockListInstance.isDocumentLocked({doc: doc})) {
                    await this.ngivrLockListInstance.lockDocument({doc: doc});
                    $scope.loadContract({id: doc._id, newP: false, contractObj: doc})
                } else {
                    ngivr.growl('A szerződést más felhasználó zárolta, pillanatnyilag nem tölthető be.')
                }
            }

            this.search = (query) => {
                const $scope = this.$scope;
                let search = '';
                if ($scope.inputSearch !== undefined) {
                    search = $scope.inputSearch;
                }

                const status = $scope.status;
                query.search = {
                    contract: true,
                    buy: $scope.ngivrQuery.search.buy,
                    $and: [
                        {
                            $or: [
                                {
                                    'partner.name': {
                                        '$regex': search,
                                        '$options': 'i'
                                    }
                                },
                                {
                                    'contractNumber': {
                                        '$regex': search,
                                        '$options': 'i'
                                    }
                                },
                                {
                                    'partnerContractNumber': {
                                        '$regex': search,
                                        '$options': 'i'
                                    }
                                }
                            ]
                        }
                    ],

                };
                switch (status) {
                    case '1': //összes
                        break;
                    case 2: //új esemény
                        query.search.$and.push({$or: [{newEventsByOwner: {$gt: 0}}, {newEventsBySystem: {$gt: 0}}]}); //= query.search.$and.concat([{newEventsByOwner: {$gt: 0}}, {newEventsBySystem: {$gt: 0}}])
                        break;
                    case 3: //folyamatban
                        query.search.closed = {$ne: true};
                        query.search.sentOutSignedByBoth = {$ne: true};
                        query.search.sentBackSignedByBoth = {$ne: true};
                        query.search.signedInPerson = {$ne: true};
                        break;
                    case 4: //nem kiküldött, nem aláírt
                        query.search.closed = {$ne: true};
                        query.search.sentOut = {$ne: true};
                        query.search.signed = {$ne: true};
                        query.search.signedBySygnusBeforePartner = {$ne: true};
                        break;
                    case 5: //kiküldött, nem aláírt
                        query.search.closed = {$ne: true};
                        query.search.sentOut = true;
                        query.search.signed = {$ne: true};
                        break;
                    case 6: //aláírt
                        query.search.closed = {$ne: true};
                        query.search.signed = true;
                        query.search.signedBySygnusAfterPartner = {$ne: true};
                        query.search.sentOutSignedByBoth = {$ne: true};
                        break;
                    case 7: //sygnus által aláírt
                        query.search.closed = {$ne: true};
                        query.search.signedBySygnusAfterPartner = true;
                        query.search.sentOutSignedByBoth = {$ne: true};
                        break;
                    case 8: //ügyfélpéldány visszaküldve
                        query.search.closed = {$ne: true};
                        query.search.sentOutSignedByBoth = true;
                        break;
                    case 9: //nem kiküldött, sygnus aláírta
                        query.search.closed = {$ne: true};
                        query.search.signedBySygnusBeforePartner = true;
                        query.search.sentOutSignedBySygnus = {$ne: true};
                        break;
                    case 10: //kiküldött, sygnus aláírta
                        query.search.closed = {$ne: true};
                        query.search.signedBySygnusBeforePartner = true;
                        query.search.sentOutSignedBySygnus = true;
                        query.search.sentBackSignedByBoth = {$ne: true};
                        break;
                    case 11://aláírt visszaérkezett
                        query.search.closed = {$ne: true};
                        query.search.signedBySygnusBeforePartner = true;
                        query.search.sentOutSignedBySygnus = true;
                        query.search.sentBackSignedByBoth = true;
                        break;
                    case 12: //lezárt
                        query.search.closed = true;
                }
                //query.sort = {'updatedAt' : -1}
            };

            this.show = () => {
                alert('show');
            }
    }

    }
});
