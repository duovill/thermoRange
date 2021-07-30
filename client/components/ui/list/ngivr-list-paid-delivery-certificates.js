'use strict';
ngivr.angular.directive('ngivrListPaidDeliveryCertificates', ($window) => {
    return {
        restrict: 'E',
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-paid-delivery-certificates.html',
        scope: {
            ngivrQuery: '=',
            // year:'=',
            // month:'='
            // sygnus: '<?',
            // direction: "<?",
            //   owner: '<?'
        },
        transclude: true,
        controller: class {

            constructor($scope, $http) {
                this.$scope = $scope;

                // ha torles van, akkor igy kell hasznalni (ures lesz minden)
                $scope.$on(ngivr.settings.event.client.list.clear, () => {
                    $scope.textSearch = undefined;
                    $scope.product = undefined;
                    // $scope.direction = 'all';
                    // $scope.owner = 'all';
                    // $scope.from = undefined;
                    // $scope.plateNumber = undefined;
                    // $scope.to = undefined;
                    // $scope.tcn = undefined;
                    // $scope.partner = undefined;
                    // $scope.sygnus = true;
                    $scope.year = moment().year();
                    $scope.month = moment().month();


                });
                let queryDate = moment().subtract(1, 'months');
                //moment months are 0 based!
                $scope.year = $scope.ngivrQuery.year || queryDate.year();
                this.year = $scope.year;
                //moment months are 0 based!
                $scope.month = $scope.ngivrQuery.month || (queryDate.month() + 1);
                this.month = $scope.month;
                $scope.$watchGroup(['year', 'month', 'textSearch'], () => {
                    // console.log("Query was built");
                    this.search($scope.ngivrQuery);
                    ngivr.list.requery($scope);

                });

                this.filename = $scope.fileName || 'Számlastatisztika.xlsx';
                this.$id = $scope.$id;
                this.topOffset = $window.innerWidth < 1000 ? 0 : 73;

                $scope.downloadFile = async () => {
                    try {
                        const req = {
                            method: 'POST',
                            url: '/api/statistics/paidDeliveryCertificates',
                            headers: {
                                "Content-Type": "application/json;charset=UTF-8"
                            },
                            data: {
                                query: {year: $scope.year, month: $scope.month, text: $scope.textSearch},

                            }
                        };

                        let responseZip = await $http(req);
                        //console.warn(response);
                        if (responseZip.data.zipFileName) {
                            const zipFileName = responseZip.data.zipFileName;
                            const href = '/api/statistics/download/' + zipFileName;
                            location = href
                        } else if (responseZip.data.message) {
                            ngivr.growl(responseZip.data.message)
                        }


                    } catch (e) {
                        console.error(e);
                        if (e.data) {
                            ngivr.growl('Hiba történt az adatok lekérésénél.')
                        }
                    }

                }
            }


            search(query) {
                const $scope = this.$scope;
                const text = $scope.textSearch;
                // let conditions = [];

                // let textSearch;
                // if (s) {
                //
                //   textSearch = {
                //     $or: [
                //       {'productName': {$regex: s, $options: 'i'}},
                //       {
                //         'order.partner': {
                //           $elemMatch: {
                //             name: {
                //               $regex: s,
                //               $options: 'i'
                //             }
                //           }
                //         }
                //       },
                //       {'order.name': {$regex: s, $options: 'i'}},
                //       {'orderNumber': {$regex: s, $options: 'i'}},
                //
                //     ]
                //   };
                //   conditions.push(textSearch);
                // }
                //
                // if ($scope.from && moment($scope.from).isValid()) {
                //   conditions.push({
                //     fulfillmentDate: {
                //       $gte: new Date($scope.from)
                //     }
                //   });
                // }
                //
                // if ($scope.to && moment($scope.to).isValid()) {
                //   let to = new Date($scope.to);
                //   to.setDate(to.getDate() + 1);
                //   conditions.push({
                //     fulfillmentDate: {
                //       $lte: to
                //     }
                //   });
                // }
                //
                // if ($scope.tcn) {
                //   conditions.push({
                //     'ledger.tcn': {
                //       $eq: $scope.tcn.tcn
                //     }
                //   })
                // }
                //
                // if ($scope.plateNumber) {
                //   conditions.push({
                //     'plateNumber1': {
                //       $eq: $scope.plateNumber._id.plateNumber
                //     }
                //   })
                // }
                //
                // if ($scope.partner) {
                //   conditions.push({
                //     $or: [
                //       {
                //         "order.partner.name": {
                //           $eq: $scope.partner.name
                //         }
                //       },
                //       {
                //         "contract.partner.name": {
                //           $eq: $scope.partner.name
                //         }
                //       }
                //     ]
                //   });
                // }
                //
                // if ($scope.owner && $scope.owner !== 'all') {
                //     conditions.push({
                //         sygnus: {
                //             $eq: $scope.owner === 'sygnus'
                //         }
                //     });
                // }
                //
                // // if ($scope.sygnus) {
                // //   conditions.push({
                // //     "sygnus": {
                // //       $eq: true
                // //     }
                // //   });
                // // } else {
                // //   conditions.push({
                // //     "sygnus": {
                // //       $eq: false
                // //     }
                // //   });
                // // }
                //
                // conditions.push({"deleted": {$eq: false}});
                //
                // if ($scope.product) {
                //   conditions.push({
                //     productName: {
                //       $eq: $scope.product.name
                //     }
                //   });
                // }
                //
                // if ($scope.direction && $scope.direction !== 'all') {
                //   conditions.push({
                //     direction: {
                //       $eq: $scope.direction
                //     }
                //   });
                // }
                // //csak a nem törölt ticketek
                // conditions.push({deleted: {$ne: true}});
                //
                // if (conditions.length > 0) {
                //   query.search = {$and: conditions};
                // } else {
                //   query.search = {};
                // }
                query.search = {year: $scope.year, month: $scope.month, text: text};


            }

        }
    }
});
