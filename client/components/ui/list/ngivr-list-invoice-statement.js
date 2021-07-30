'use strict';
ngivr.angular.directive('ngivrListInvoiceStatement', ($window) => {
    return {
        restrict: 'E',
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-invoice-statement.html',
        scope: {
            ngivrQuery: '=',
            schema: '<',
            sygnus: '<?',
            direction: "<?"
        },
        transclude: true,
        controller: function ($scope, $mdDialog, ngivrPopupPdfList) {
            this.$scope = $scope;

            //$scope.ngivrSchema = $scope.schema;

            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.clear, () => {
                this.textSearch = undefined;
                $scope.partner = undefined;
                $scope.product = undefined;
                $scope.from = undefined;
                $scope.to = undefined
            });

            $scope.openPdfList = (opts) => {
                const { doc } = opts;
                //console.warn('doc', opts, doc.ngivrPdf)
                const popup = new ngivrPopupPdfList()
                opts.title = 'Meglévő bejövő számla';
                opts.qrTemplate = 'bejovo-szamla-cimke';
                opts.schema = 'incomingInvoice';
                opts.qrLabel = 'Bejövő számla QR cimke';
                //console.warn(popup)
                popup.show(opts)
                //console.warn('openPdfList', opts)
            }

            switch (this.$scope.schema) {
                case 'incomingInvoice':
                    $scope.name = 'bejövő';
                    $scope.ngivrUrl = '/api/xlsdocument/incoming-invoices';
                    break;
                case 'outgoingInvoice':
                    $scope.name = 'kimenő';
                    $scope.ngivrUrl = '/api/xlsdocument/outgoing-invoices';
                    break;
                case 'deliveryCertificate':
                    $scope.name = 'felv_jegy';
                    $scope.ngivrUrl = '/api/xlsdocument/delivery-certificates';
                    break;
            }


            this.sygnus = $scope.sygnus;
            this.direction = $scope.direction;
            this.filename = $scope.fileName || 'Számla_kimutatás_' + $scope.name + '.xlsx';
            this.$id = $scope.$id;
            this.topOffset = $window.innerWidth < 1000 ? 0 : 73;


            $scope.showDetailsPopup = (ev, doc) => {

                $mdDialog.show({
                    controller: DialogController,
                    templateUrl: 'components/ui/popup/invoice/ngivr-popup-invoice-details.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    doc: doc,
                    //field: field,

                    //fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
                })
                    .then(function (answer) {
                        $scope.status = 'You said the information was "' + answer + '".';
                    }, function () {
                        $scope.status = 'You cancelled the dialog.';
                    });

                function DialogController($scope, $mdDialog, doc) {
                    $scope.doc = doc;


                    $scope.hide = function () {
                        $mdDialog.hide();
                    };

                    $scope.cancel = function () {
                        $mdDialog.cancel();
                    };

                    $scope.answer = function (answer) {
                        $mdDialog.hide(answer);
                    };
                }
            };

            $scope.$watchGroup(['from', 'to'], () => {
                // console.log("Query was built");
                this.search($scope.ngivrQuery);
                ngivr.list.requery($scope);

            });

            $scope.openPdf = (doc) => {
                window.open(doc.pdfUrl)
            };

            $scope.detailedInvoices = [];


            /**
             * a $scope.detailedInvoices tömbben tároljuk azoknak az számláknak az id-ját,
             * amelyeknél mutatjuk a részleteket
             * @param id
             */
            $scope.showDetails = (id) => {
                if ($scope.detailedInvoices.includes(id)) {
                    $scope.detailedInvoices.splice($scope.detailedInvoices.indexOf(id), 1)
                } else {
                    $scope.detailedInvoices.push(id)
                }
            };


            this.search = (query) => {
                const $scope = this.$scope;
                const s = $scope.textSearch;
                let conditions = [];

                let textSearch;
                if (this.textSearch) {
                    let s = this.textSearch;
                    textSearch = { //partner, termék, megjegyzés, adószám
                        $or: [
                            {'incomingSeller.0.name': {$regex: s, $options: 'i'}},
                            {'buyer.0.name': {$regex: s, $options: 'i'}},
                            {'seller.name': {$regex: s, $options: 'i'}},
                            {'items.product.name': {$regex: s, $options: 'i'}},

                            {'comments': {$regex: s, $options: 'i'}},
                            {'vatNumber': {$regex: s, $options: 'i'}},
                            {'vatNumber.number': {$regex: s, $options: 'i'}},

                        ]
                    };
                    conditions.push(textSearch);
                }

                if ($scope.partner) {
                    conditions.push({
                        $or: [
                            {
                                'incomingSeller.0.name': $scope.partner.name
                            },
                            {
                                'buyer.0.name': $scope.partner.name
                            },
                            {
                                'seller.name': $scope.partner.name
                            }
                        ]
                    });
                }

                if ($scope.product) {
                    conditions.push({
                        'items.product.name': $scope.product.name
                    });
                }

                if ($scope.from && moment($scope.from).isValid()) { //kiállítás dátuma -tól
                    if ($scope.schema === 'incomingInvoice') {
                        conditions.push({
                            dateOfInvoice: {
                                $gte: new Date($scope.from)
                            }
                        });
                    } else {
                        conditions.push({
                            createdAt: {
                                $gte: new Date($scope.from)
                            }
                        });
                    }
                }

                if ($scope.to && moment($scope.to).isValid()) {
                    let to = new Date($scope.to);
                    to.setDate(to.getDate() + 1);
                    if ($scope.schema === 'incomingInvoice') {
                        conditions.push({
                            dateOfInvoice: {
                                $lte: to
                            }
                        });
                    } else {
                        conditions.push({
                            createdAt: {
                                $lte: to
                            }
                        });
                    }
                }

                if (conditions.length > 0) {
                    query.search = {$and: conditions};
                } else {
                    query.search = {};
                }
            }
        }


    }
});
