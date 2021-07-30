'use strict';
ngivr.angular.directive('ngivrListDeliveryCertificate', (ngivrLockList) => {
    return {
        restrict: 'E',
        scope: {
            show: '=',
            item: '<',
            registryStatusList: '<',
            incomingTypesList: '<',
            payModeList: '<',
            typeList: '<',
            variables: '='
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-delivery-certificate.html',
        controller: class {

            constructor($scope, $stateParams, ngivrSocketLock, socket, Auth, Common, ngivrPopupDeliveryCertificate) {


                // this.ngivrLockListInstance = ngivrLockList({
                //     scope: $scope,
                //     schema: 'deliveryCertificate',
                //     watch: 'docs',
                //     list: true,
                //     onUnlock: (options) => {
                //         // console.log(options)
                //         // $scope.selected = $scope.selected.filter(doc => {
                //         //     return options.doc._id !== doc._id;
                //         // })
                //         // self.$scope.dispo.selectAll = false
                //     },
                //     onAutoUnlockOrError: (options) => {
                //         //console.log(options);
                //         // self.$scope.dispo.selectAll = false
                //         // $scope.selected = [];
                //         // $scope.publish('closePopup')
                //     }
                // })

                $scope.$on(ngivr.settings.event.client.list.loaded, async (data) => {

                    $scope.docs = data.targetScope.query.docs;

                });



                this.$scope = $scope;
                $scope.Common = Common;
                if ($stateParams.item) $scope.typeList = $stateParams.item.typeList;
                // ha torles van, akkor igy kell hasznalni (ures lesz minden)
                $scope.$on(ngivr.settings.event.client.list.clear, () => {
                    $scope.inputSearch = undefined;
                });

                /**
                 * Ellenőrzi, hogy lockolva van-e a felv.jegy
                 * @param id
                 * @returns {boolean}
                 */
                // $scope.isLocked = (id) => {
                //     try {
                //         let lock = $scope.redisLockList.filter((o) => {
                //             return o.doc === 'deliveryCertificate:' + id
                //         });
                //
                //         if (!lock.length) return false;
                //
                //
                //         if (lock[0].user !== Auth.getCurrentUser()._id) return true;
                //
                //     }
                //     catch (err) {
                //         return false
                //     }
                //
                // };

                /**
                 * Felv. jegy részletes nézet ki-, bekapcsolása
                 * @param tabType
                 * @param subTabType
                 * @param invoice
                 * @param idx
                 */
                $scope.toggleDeliveryCertificate = function (tabType, subTabType, invoice, idx) {
                    /*
                    invoice.showDetails = !invoice.showDetails;
                    if ($scope.showDetails === undefined) { //ha nincs, létrehozzuk, és az aktuálisat true-ra állítjuk
                        $scope.showDetails = new Array(idx + 1);
                        $scope.showDetails[idx] = true;
                    } else if ($scope.showDetails[idx] === undefined) { //ha a tömb aktuális eleme undefined, úgy járunk el, mint fent
                        $scope.showDetails = new Array(idx + 1);
                        $scope.showDetails[idx] = true;
                    } else { //
                        $scope.showDetails[idx] = !$scope.showDetails[idx]
                    }
                    */
                    ngivrPopupDeliveryCertificate.show({
                        $parent: $scope,
                        doc: invoice,
                    })
                };

                /**
                 * Felv. jegy storno
                 */
                $scope.startStorno = async (doc) => {
                        $scope.publish('loadToStorno', doc)
                };

                /**
                 * Felv. jegy bonifikáció
                 * @param doc
                 */
                $scope.startBonification = async (doc) => {
                    $scope.publish('startBonification', doc)
                };

                /**
                 * Felv. jegy visszatöltése
                 * @param doc
                 */
                $scope.loadDeliveryCertificate = (doc) => {
                    $scope.publish('loadDeliveryCertificate', doc)
                }

                // $scope.openPdf = (doc) => {
                //   window.open(doc.pdfUrl)
                // }

            }

            search(query) {
                const $scope = this.$scope;
                const search = $scope.inputSearch;

                query.search = {
                    $or: [
                        {
                            'seller.name': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        },
                        {
                            'number': {
                                '$regex': search,
                                '$options': 'i'
                            }
                        }
                    ]
                };
            }

            // isLocked(doc) {
            //     return this.ngivrLockListInstance.isDocumentLocked({
            //         doc: doc
            //     })
            // };
        }
    }
});
