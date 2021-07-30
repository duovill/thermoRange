'use strict';

ngivr.angular.directive('ngivrPopupStock', (ngivrService) => {
    const service = ngivrService;
    return {
        restrict: 'E',
        // require: 'ngModel',
        transclude: true,
        controller: function ($rootScope, $scope, $mdDialog) {
            $scope.ngivr = service;

            $mdDialog.show({

                templateUrl: 'components/ui/popup/stock/ngivr-popup-stock.html',
                fullscreen: true,
                controller: StockController

            });


            function StockController($rootScope, $scope, $mdDialog, $http, ngivrHttp, socket, Common, Auth) {

                const start = async () => {
                    $scope.currentUser = Auth.getCurrentUser();
                    $scope.partnerSites = [];
                    $scope.ngivrUrl = {};
                    $scope.currentIndex = 0;

                    $scope.selected = {
                        selectedSitePartner: undefined,
                        product: undefined,
                        itkProduct: undefined,
                        itkPartner: undefined
                    };

                    $scope.partnerQuery = {
                        type: 'partner',
                        query: {
                            sygnus: false,
                            siteId: $scope.currentUser.site ? $scope.currentUser.site._id : undefined
                        }
                    };

                    $scope.$watch('selectedPartner', (newVal, oldVal) => {

                        if (newVal) {
                            $scope.partnerQuery.query = {partnerId: newVal._id}
                        } else {
                            $scope.partnerQuery.query = {
                                sygnus: false,
                                siteId: $scope.currentUser.site ? $scope.currentUser.site._id : undefined
                            }
                        }
                    }, true);

                    const ngivrDataQueryOwnsites = service.data.query({
                        schema: 'site',
                        $scope: $scope,
                        query: {
                            search: {
                                own: true,
                                _id: $scope.currentUser.site ? $scope.currentUser.site._id : undefined
                            },
                            limit: 0,
                            sort: {name: 1},
                        },
                        subscribe: async (promise) => {
                            try {
                                const response = await promise;
                                $scope.ownSites = response.data.docs

                            } catch (e) {
                                console.error(e)
                            }

                        }
                    });

                    await ngivrDataQueryOwnsites.query();

                    const ngivrDataQueryItk = service.data.query({
                        schema: 'site',
                        $scope: $scope,
                        query: {
                            search: {
                                own: false
                            },
                            limit: 0,
                            sort: {name: 1},
                        },
                        subscribe: async (promise) => {
                            try {
                                const response = await promise;
                                $scope.itks = response.data.docs

                            } catch (e) {
                                console.error(e)
                            }

                        }
                    });

                    await ngivrDataQueryItk.query();

                    const ngivrDataQuerySygnusProducts = service.data.query({
                        schema: 'product',
                        $scope: $scope,
                        query: {
                            search: {
                                itemType: 'Sygnus termények'
                            },
                            limit: 0,
                            sort: {name: 1},
                        },
                        subscribe: async (promise) => {
                            try {
                                const response = await promise;
                                $scope.sygnusProducts = response.data.docs

                            } catch (e) {
                                console.error(e)
                            }

                        }
                    });

                    await ngivrDataQuerySygnusProducts.query();

                    /**
                     * Készletek lekérdezése
                     * @param options
                     * @returns {Promise<void>}
                     */
                    $scope.getProductsInDepots = async (options) => {
                        const {query, type} = options;
                        let response = await ngivrHttp.get('api/depots/getDepotsByParameters', {params: query});
                        let depots = response.data.depots;
                        console.log(`${type === 'own' ? 'Saját' : type === 'itk' ? 'ITK' : 'Partneres'} raktárak`);
                        console.log(depots);
                        let products = {};


                        let partnerSites = [];

                        for (let depot of depots) {
                            if (type === 'partner') {
                                if (partnerSites.length) {
                                    let idx = Common.functiontofindIndexByKeyValue(partnerSites, 'id', depot.siteId);
                                    if (idx === null) {
                                        partnerSites.push({id: depot.siteId, name: depot.siteName, products: []})
                                    }
                                } else {
                                    partnerSites.push({id: depot.siteId, name: depot.siteName, products: []})
                                }
                            }
                            if (products.hasOwnProperty(depot.product)) {

                                if (type === 'partner') {
                                    products[depot.product].total += depot.total;
                                    products[depot.product].free += depot.free;
                                    products[depot.product].reserved += depot.reserved;


                                } else {
                                    products[depot.product] += depot.total;
                                }

                            } else {
                                if (type === 'partner') {
                                    products[depot.product] = {};
                                    products[depot.product].total = depot.total;
                                    products[depot.product].reserved = depot.reserved;
                                    products[depot.product].free = depot.free;


                                } else {
                                    products[depot.product] = depot.total;
                                }


                            }
                        }
                        switch (type) {
                            case 'own' :
                                $scope.ownProducts = products; // saját raktárban levő termények listája mennyiséggel
                                break;
                            case 'itk' :
                                $scope.itkProducts = products; // itk-ban levő termények listája, mennyiséggel
                                break;
                            case 'partner':
                                $scope.partnerProducts = products;
                                for (let depot of depots) {
                                    // let idx = partnerSites.findIndex((el) => {
                                    //     return el.id === depot.siteId && el.serviceContractId === depot._id.serviceContractId
                                    // })
                                    let idx = Common.functiontofindIndexByKeyValue(partnerSites, 'id', depot.siteId);
                                    if (idx === null) {
                                        console.log(idx)
                                    } else {
                                        console.log(idx);

                                        //let prodIdx = Common.functiontofindIndexByKeyValue(partnerSites[idx].products, 'productName', depot.product);
                                        let prodIdx = partnerSites[idx].products.findIndex((el) => {
                                            if ($scope.selectedPartner) {
                                                return el.productName === depot.product && el.serviceContractId === depot._id.serviceContractId
                                            } else {
                                                return el.productName === depot.product
                                            }
                                        });
                                        if (prodIdx !== -1) {
                                            partnerSites[idx].products[prodIdx].total += depot.total;
                                            partnerSites[idx].products[prodIdx].free += depot.free;
                                            partnerSites[idx].products[prodIdx].reserved += depot.reserved;
                                        } else {
                                            partnerSites[idx].products.push({
                                                serviceContractId: $scope.selectedPartner ? depot._id.serviceContractId : undefined,
                                                serviceContractName: $scope.selectedPartner ? depot.serviceContract.name : undefined,
                                                productName: depot.product,
                                                total: depot.total,
                                                free: depot.free,
                                                reserved: depot.reserved
                                            })
                                        }

                                    }
                                }
                                $scope.partnerSites = partnerSites;
                                break
                        }
                    };

                    /**
                     * Bezárja a popup-ot
                     */
                    $scope.cancel = function () {
                        $mdDialog.hide().then(() => {
                            $rootScope.$broadcast("closeStockPopup");
                        });
                    };

                    /**
                     * Raktár készlet változásakor frissíti az adatokat
                     * @param data
                     * @returns {Promise<void>}
                     */
                    const depotListener = async (data) => {
                        if (data.site[0].own === true) {
                            await $scope.getProductsInDepots({
                                type: 'own',
                                query: {own: true, partnerId: ngivr.settings.ownFirm._id}
                            });
                            await $scope.getProductsInDepots({
                                type: 'partner',
                                query: $scope.selectedPartner ? {partnerId: $scope.selectedPartner._id} : {sygnus: false}
                            });
                        } else {
                            await $scope.getProductsInDepots({
                                type: 'itk',
                                query: {own: false, partnerId: ngivr.settings.ownFirm._id}
                            });
                        }
                    };

                    const stockValueListener = async () => {
                        await getStockValues()
                    };

                    /**
                     * Feliratkozás raktárkészlet változásra
                     */
                    socket.socket.on('depot:save', depotListener);

                    /**
                     * Feliratkozás stockValues változására
                     */
                    socket.socket.on('stockValue:save', stockValueListener);

                    /**
                     * Leiratkozás raktár figyeléséről
                     */
                    $scope.$on('$destroy', async () => {
                        socket.socket.removeListener('depot:save', depotListener);
                        socket.socket.removeListener('stockValue:save', stockValueListener)
                    });


                    if ($scope.currentUser.site) {
                        /**
                         * Partner terménylista lekérése
                         */
                        await $scope.getProductsInDepots($scope.partnerQuery);
                    } else {
                        /**
                         * Sygnus terménylista lekérése, saját raktár
                         */
                        await $scope.getProductsInDepots({
                            type: 'own',
                            query: {own: true, partnerId: ngivr.settings.ownFirm._id}
                        });

                        /**
                         * Sygnus terménylista lekérése, ITK
                         */
                        await $scope.getProductsInDepots({
                            type: 'itk',
                            query: {own: false, partnerId: ngivr.settings.ownFirm._id}
                        });
                    }


                    const getStockValues = async () => {
                        if ($scope.currentUser.site === undefined || $scope.currentUser.site === null) {
                            let stockValues = await ngivrHttp.get('/api/stockValues'); //.then(function (stockValues) {
                            for (let i = 0; i < $scope.sygnusProducts.length; i++) {
                                for (let j = 0; j < stockValues.data.length; j++) {
                                    if ($scope.sygnusProducts[i]._id === stockValues.data[j].productId) {
                                        $scope.sygnusProducts[i].quantity = stockValues.data[j].quantity;
                                        $scope.sygnusProducts[i].buhg = stockValues.data[j].sustainability.buhg;
                                        $scope.sygnusProducts[i].iscc = stockValues.data[j].sustainability.iscc;
                                        break;
                                    }
                                }
                            }
                        }

                    };

                    await getStockValues();

                    //partner készlet tab

                    $scope.selectedPartner = null;
                    //$scope.selectedSite = null;


                    //telephelyek tab
                    $scope.loadedTab = false;

                    $scope.selectedSitePartner = null;
                    $scope.selectedProduct = null;
                    $scope.selectedOwnSite = null;

                    $scope.$watch('selectedOwnSite', (newVal, oldVal) => {
                        //alert('selectedOwnSite changed!')
                        console.log('selectedOwnSite');
                        console.log(oldVal, newVal)
                    });

                    $scope.$watch('currentIndex', (newVal, oldVal) => {
                        //alert('currentIndex changed!')
                        console.log('currentIndex');
                        console.log(oldVal, newVal)
                    });

                    /**
                     * Ha a listán raktárt választunk, itt történik meg a szűrés
                     */
                    $scope.subscribe('selectDepot', async (depotId) => {
                        if (depotId !== $scope.selectedDepotId) {
                            $scope.selectedDepotId = depotId;
                            if ($scope.selectedOwnSite && !$scope.loadedItkTab) {
                                $scope.loadedTab = false;
                                //console.log(newPartner);

                                // alert('hívjuk depot')
                                await $scope.onOwnSiteSelected({
                                    site: $scope.selectedOwnSite,
                                    partnerId: $scope.selectedSitePartner ? $scope.selectedSitePartner._id : undefined,
                                    productId: $scope.selectedProduct ? $scope.selectedProduct._id : undefined,
                                    depotId: $scope.selectedDepotId ? $scope.selectedDepotId : undefined,
                                    currentTabIndex: $scope.currentIndex
                                });
                                $scope.loadedTab = true;
                            } else if ($scope.loadedItkTab) {
                                $scope.loadedItkTab = false;
                                //console.log(newProduct);
                                //$scope.selected.itkProduct = newProduct;

                                $scope.loadItkTab({
                                    productId: $scope.selected.itkProduct ? $scope.selected.itkProduct._id : undefined,
                                    partnerId: $scope.selected.itkPartner ? $scope.selected.itkPartner._id : undefined,
                                    depotId: $scope.selectedDepotId ? $scope.selectedDepotId : undefined
                                });
                            }
                        }


                    });

                    $scope.$watch("selected.sitePartner", async (newPartner, oldPartner) => {

                        // alert(`newPartner: ${newPartner}`)
                        // alert(`oldPartner: ${oldPartner}`)
                        if (newPartner !== oldPartner) {
                            $scope.loadedTab = false;
                            console.log(newPartner);
                            $scope.selectedSitePartner = newPartner;
                            // alert('hívjuk partner')
                            await $scope.onOwnSiteSelected({
                                site: $scope.selectedOwnSite,
                                partnerId: $scope.selectedSitePartner ? $scope.selectedSitePartner._id : undefined,
                                productId: $scope.selectedProduct ? $scope.selectedProduct._id : undefined,
                                depotId: $scope.selectedDepotId ? $scope.selectedDepotId : undefined,
                                currentTabIndex: $scope.currentIndex
                            });
                            $scope.loadedTab = true;
                        }
                    });

                    $scope.$watch("selected.product", async (newProduct, oldProduct) => {
                        if (newProduct !== oldProduct) {
                            $scope.loadedTab = false;
                            console.log(newProduct);
                            $scope.selectedProduct = newProduct;
                            // alert('hívjuk product')
                            await $scope.onOwnSiteSelected({
                                site: $scope.selectedOwnSite,
                                partnerId: $scope.selectedSitePartner ? $scope.selectedSitePartner._id : undefined,
                                productId: $scope.selectedProduct ? $scope.selectedProduct._id : undefined,
                                depotId: $scope.selectedDepotId ? $scope.selectedDepotId : undefined,
                                currentTabIndex: $scope.currentIndex
                            });
                            $scope.loadedTab = true;
                        }
                    });


                    $scope.onOwnSiteSelected = async (options) => {
                        const {site, partnerId, productId, own, currentTabIndex, depotId} = options;

                        $scope.currentIndex = currentTabIndex;
                        $scope.ngivrUrl.ownSites = `api/depots/getDepotsBySite/${site._id}/${partnerId}/${productId}/${own}/${depotId}`;
                        $scope.selectedOwnSite = site;


                    };

                    //ITK tab

                    $scope.loadedItkTab = false;

                    $scope.loadItkTab = (options) => {
                        $scope.loadedItkTab = false;
                        const {partnerId, productId, depotId} = options;
                        $scope.ngivrUrl.itk = `api/depots/getDepotsBySite/undefined/${partnerId}/${productId}/false/${depotId}`;
                        $scope.loadedItkTab = true;

                    };

                    //$scope.loadItkTab({});

                    $scope.$watch("selected.itkProduct", (newProduct, oldProduct) => {
                        if (newProduct !== oldProduct) {
                            $scope.loadedItkTab = false;
                            console.log(newProduct);
                            //$scope.selected.itkProduct = newProduct;

                            $scope.loadItkTab({
                                productId: $scope.selected.itkProduct ? $scope.selected.itkProduct._id : undefined,
                                partnerId: $scope.selected.itkPartner ? $scope.selected.itkPartner._id : undefined,
                                depotId: $scope.selectedDepotId ? $scope.selectedDepotId : undefined
                            });
                        }
                    });

                    $scope.$watch("selected.itkPartner", (newPartner, oldPartner) => {
                        if (newPartner !== oldPartner) {
                            $scope.loadedItkTab = false;
                            console.log(newPartner);
                            //$scope.selected.itkPartner = newPartner;

                            $scope.loadItkTab({
                                productId: $scope.selected.itkProduct ? $scope.selected.itkProduct._id : undefined,
                                partnerId: $scope.selected.itkPartner ? $scope.selected.itkPartner._id : undefined,
                                depotId: $scope.selectedDepotId ? $scope.selectedDepotId : undefined
                            });
                        }
                    });

                    $scope.onTabChanges = function (currentTabIndex) {
                        console.log('Current tab ' + currentTabIndex);
                        $scope.currentIndex = currentTabIndex
                    }

                };

                start()


                /*

              Ha majd kell a vintage rész...

              */
                // $http.get('/api/stockPerVintages').then(function (stockPerVintages) {

                //test data for display
                /*stockPerVintages = {
                    data: [{
                        productId: sygnusProducts[0]._id,
                        quantity: 50,
                        vintage: "2007"
                    }, {
                        productId: sygnusProducts[0]._id,
                        quantity: 100,
                        vintage: "2009"
                    }, {
                        productId: sygnusProducts[1]._id,
                        quantity: 200,
                        vintage: "2011"
                    }, {
                        productId: sygnusProducts[0]._id,
                        quantity: 141,
                        vintage: "2017"
                    }, {
                        productId: sygnusProducts[2]._id,
                        quantity: 63,
                        vintage: "2011"
                    }, {
                        productId: sygnusProducts[0]._id,
                        quantity: 150,
                        vintage: "2009"
                    },]
                };*/


                // let possibleVintages = [];
                //
                // for (let i = 0; i < sygnusProducts.length; i++) {
                //     sygnusProducts[i].vintages = [];
                //     for (let j = 0; j < stockPerVintages.data.length; j++) {
                //         if (sygnusProducts[i]._id === stockPerVintages.data[j].productId && stockPerVintages.data[j].quantity > 0) {
                //             /*sygnusProducts[i].vintages = [...sygnusProducts[i].vintages, {
                //               vintage: stockPerVintages.data[j].vintage,
                //               quantity: stockPerVintages.data[j].quantity
                //             }];*/
                //
                //             if (!sygnusProducts[i].vintages[stockPerVintages.data[j].vintage]) {
                //                 sygnusProducts[i].vintages[stockPerVintages.data[j].vintage] = 0;
                //             }
                //             sygnusProducts[i].vintages[stockPerVintages.data[j].vintage] += stockPerVintages.data[j].quantity;
                //
                //             if (possibleVintages.indexOf(stockPerVintages.data[j].vintage) === -1) {
                //
                //                 possibleVintages = [...possibleVintages, stockPerVintages.data[j].vintage];
                //             }
                //         }
                //     }
                //
                //     possibleVintages.sort((prevItem, nextItem) => nextItem - prevItem);
                //
                // }
                // $scope.possibleVintages = possibleVintages;
                // $scope.sygnusProducts = sygnusProducts;

                // });

            }
        }
    }
});
