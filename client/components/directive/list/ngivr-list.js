'use strict';
ngivr.angular.directive('ngivrList', (ngivrService, $timeout, $window, ngivrException) => {
    const service = ngivrService;

    const sorterPosition = ['before', 'after']

    return {
        restrict: 'E',
        controllerAs: '$ctrl',
        scope: {
            ngivrSchema: '@',
            ngivrSchemaDynamic: '<',
            ngivrRef: '=',
            ngivrUrl: '@',
            ngivrQuery: '=?',
            ngivrSort: '=?',
            ngivrUnion: '<',
            dontClear: '<?',
            ngivrRestricted: '<?',
            ngivrSearcherSwitchInButtons: '<?',
            ngivrSearcherSwitchOff: '<?',
            hideDefaultSortOptions: '<?',
            publishSort: '<?'
        },
        transclude: {
            'buttons': '?ngivrListButtons',
            'searcher': '?ngivrListSearcher',
            'header': '?ngivrListHeader',
            'template': 'ngivrListTemplate',
        },
        templateUrl: 'components/directive/list/ngivr-list.html',
        link: (scope, el) => {
            /*
            let parent = $(el);
            do {
              parent.css('touch-action', 'pan-x pan-y');
              parent = parent.parent();
            } while (parent.length > 0);
            */
//            console.warn('ngivr query sort test', scope.ngivrQuery)
            if (scope.ngivrSearcherSwitchOff === undefined) {
                scope.ngivrSearcherSwitchOff = false;
            }
            if (scope.ngivrSearcherSwitchInButtons === undefined) {
                scope.ngivrSearcherSwitchInButtons = false;
            }
            if (scope.ngivrSort === undefined) {
                scope.ngivrSort = {};
            }
            if (!scope.ngivrSort.hasOwnProperty('items')) {
                scope.ngivrSort.items = [];
            }
            if (!scope.ngivrSort.hasOwnProperty('position')) {
                scope.ngivrSort.position = sorterPosition[0];
            }
            if (!sorterPosition.includes(scope.ngivrSort.position)) {
                const error = new Error(`Invalid ngivr-sort position: ${position.sorterPosition(',')}`)
                ngivr.exception.handler(error);
            }
            scope.ngivrListGetWidth = () => {
                return el.width();
            }

            function onResize() {
                const width = scope.ngivrListGetWidth();
                if (scope.ngivrListWidth !== width) {
                    scope.ngivrListWidth = width;
                }
            };
            scope.$watch(() => el.width(), onResize)

        },
        controller: function ($scope, $transclude) {

            this.loaded = false;
            $scope.ngivr = service;

            $scope.transcludePresent = function(slot) {
                return $transclude.isSlotFilled(slot);
            };

            if ($scope.ngivrSchemaDynamic) {
                $scope.ngivrSchema = $scope.ngivrSchemaDynamic;
            }

            if ($scope.ngivrQuery === undefined) {
                $scope.ngivrQuery = {};
            }


            if ($scope.ngivrQuery.sort === undefined) {
                $scope.ngivrQuery.sort = {};
                $scope.ngivrQuery.sort[ngivr.settings.query.sort.default.field] = ngivr.settings.query.sort.default.order
            }

            $scope.ngivrQuery.limit = $scope.ngivrQuery.limit || ngivr.settings.query.limit.default;
            $scope.ngivrQuery.page = 1;
            $scope.ngivrQuery.restricted = $scope.ngivrRestricted || []
            //console.warn($scope.ngivrQuery)
            if (typeof $scope.ngivrQuery.restricted === 'string') {
                $scope.ngivrQuery.restricted = [
                    $scope.ngivrQuery.restricted
                ]
            }

            $scope.ngivrQuery.settings = $scope.ngivrQuery.settings || {}
            $scope.ngivrQuery.settings.searchModeStartsWith = $scope.ngivrQuery.settings.searchModeStartsWith || true

            //console.warn($scope.ngivrQuery)

            this.originalQuery = angular.copy($scope.ngivrQuery);

            $scope.query = $scope.ngivrQuery;

            let currentSort = ngivr.settings.query.sort.default.field
            let currentOrder = ngivr.settings.query.sort.default.order

            const generateSort = () => {
                //console.warn('set order value', currentSort, 'order', currentOrder)
                $scope.query.sort = {};
                const order = currentOrder
                if (typeof currentSort === 'object') {
                    for(let sort of Object.keys(angular.copy(currentSort))) {
                        if (currentSort[sort] === true) {
                            $scope.query.sort[sort] = order;
                        } else {
                            $scope.query.sort[sort] = currentSort[sort]
                        }
                    }
                } else {
                    $scope.query.sort[currentSort] = order;
                }
                if ($scope.publishSort) {
                    $scope.publish($scope.publishSort.message, $scope.query.sort)
                }

            }


            if (typeof $scope.ngivrSort === 'object' && Array.isArray($scope.ngivrSort.items)) {
                // console.warn('ok', $scope.ngivrQuery.sort)
                const querySort = $scope.ngivrQuery.sort
                for (let ngivrSortItem of $scope.ngivrSort.items) {
                    const itemSort = ngivrSortItem.sort
                    const cleanItemSort = angular.copy(itemSort)
                    if (typeof querySort === 'string' && typeof cleanItemSort === 'string' && querySort === cleanItemSort) {
                        currentSort = itemSort
                        generateSort()
                        break;
                    }
                    if (typeof querySort !== 'object' || typeof cleanItemSort !== 'object') {
                        continue
                    }
                    if (Object.keys(cleanItemSort).length === Object.keys(querySort).length) {
                        let found = true
                        for (let cleanItemSortKey of Object.keys(cleanItemSort)) {
                            if (!querySort.hasOwnProperty(cleanItemSortKey) || querySort[cleanItemSortKey] !== querySort[cleanItemSortKey]) {
                                found = false
                                break;
                            }
                        }
                        if (found) {
                            currentSort = itemSort
                            generateSort()
                            break;
                        }
                    }
                }
            }
            // console.warn('default sort', JSON.stringify($scope.ngivrSort, null, 4))

            Object.defineProperty($scope, 'sort', {
                get: () => {
                    return currentSort

                    /*
                    if (_.hasIn($scope, 'query.sort')) {
                        const result = Object.keys($scope.query.sort)[0];
                        return result;
                    }ngivrQuery
                     */
                },
                set: (value) => {
                    currentSort = value
                    generateSort()
                }
            })

            Object.defineProperty($scope, 'order', {
                get: () => {
                    if (_.hasIn($scope, 'query.sort')) {
                        return currentOrder
                    }
                    return ngivr.settings.query.sort.default.order;
                },
                set: (value) => {
                    currentOrder = value
                    generateSort()
                }
            })

            this.createQuery = () => {
                //console.warn('createQuery', $scope.ngivrUrl)
                if (this.dataQuery) {
                    this.dataQuery.unsubscribe()
                }
                return service.data.query({
                    schema: $scope.ngivrSchema,
                    union: $scope.ngivrUnion,
                    url: $scope.ngivrUrl,
                    $scope: $scope,
                    scopeQuery: 'query',
                    subscribe: async (promise) => {
                        try {
                            const response = await promise;
                            //console.warn('ngivr list query subscribe', response)
                            $scope.query = response.data;
                            ngivr.event.emit($scope, ngivr.settings.event.client.list.loaded, response.data);
                            $scope.$digest()
                        } catch (e) {
                            console.error(e);
                        }
                    }
                });
            };


            this.swipe = ($e, command) => {
                ngivr.console.log(`NGIVR.LIST.SWIPE ${command}`);
                switch (command) {
                    case 'left':
                        if ($e.originalEvent.hasOwnProperty('touched') && $e.originalEvent.touches.length === 0) {
                            $scope.query.page = $scope.query.page + 1;
                        } else {
                            $scope.query.page = $scope.query.pages
                        }
                        break;

                    case 'right':
                        if ($e.originalEvent.hasOwnProperty('touched') && $e.originalEvent.touches.length === 0) {
                            $scope.query.page = $scope.query.page - 1;
                        } else {
                            $scope.query.page = 1
                        }
                        break;

                }

            }

            this.remove = async (id) => {
                try {
                    await service.confirm(ngivr.strings.question.remove)
                    await service.api.remove($scope.ngivrSchema, id)
                    await ngivr.growl(ngivr.strings.message.removed);
                    await this.query();
                } catch (e) {
                    if (e !== undefined) {
                        console.error(e)
                    }
                }
            }

            $scope.ngivrRef.ngivrListOn = {
                update: () => {
                },
            }

            this.query = async (options = {}) => {
                //console.warn('query', $scope.ngivrUrl, $scope.query)
                const {done} = options;
                const promise = this.dataQuery.query($scope.query)

                await $scope.ngivrRef.ngivrListOn.update();

                // ngivr.growl(`${Date.now()} update`)

                if (done !== undefined) {
                    try {
                        await promise;
                        await done();

                    } catch (e) {
                        ngivrException.handler(e);
                    }
                }
                return promise;
            }

            this.clear = () => {
                $scope.query = ngivr.json.clone(this.originalQuery);
                ngivr.event.emit($scope, ngivr.settings.event.client.list.clear, $scope);
                //console.warn('ngivr-list clear dontClear', $scope.dontClear, $scope)
                this.query();

                /*
                if (!$scope.dontClear) {
                    this.query();
                } else {
                    console.warn('ngivr-list clear with setTimeout')
                    //this.query()
                    $timeout(() => {
                          $scope.$apply(() => {
                              this.query()
                          })
                    })
                }
                */
            }

            this.dataQuery = this.createQuery();

            //ha az ngivrUrl változik, akkor új service.data.query kell, mert az url a configban van, ami nem változik meg,
            //ha módosítjuk a direktívában
            $scope.$watch('ngivrUrl', (newValue, oldValue) => {
                //console.warn('ngivrUrl valtozik')
                if (newValue !== oldValue) {
                    //console.warn('ngivrUrl valtozik valoban', newValue, oldValue, $scope.query)
                    //this.dataQuery = this.createQuery();
                    //console.warn(' ngivrURL query before')
                    this.dataQuery._options.url = newValue
                    this.query();
                    // console.warn(' ngivrURL query after')
                }
            });

            $scope.ngivrQueryLast = ngivr.json.clone($scope.ngivrQuery);

            // ha torles van, akkor igy kell hasznalni (ures lesz minden)
            $scope.$on(ngivr.settings.event.client.list.requery, (event, options = {}) => {
                if (options.force === true) {
                    $scope.ngivrQuery = options.query
                    $scope.ngivrQueryLast = {
                        search: {}
                    }
                }

                if (ngivr.json.equals($scope.ngivrQuery, $scope.ngivrQueryLast)) {
                    return;
                }
                if (!ngivr.json.equals($scope.ngivrQuery.search, $scope.ngivrQueryLast.search) || options.force === true) {
                    $scope.ngivrQueryLast = ngivr.json.clone($scope.ngivrQuery);
                    $scope.query.search = $scope.ngivrQuery.search;
                    this.query();
                }
            });

            //console.warn('$scope.ngivrUrl', $scope.ngivrUrl, typeof $scope.ngivrUrl)

            if ($scope.ngivrUrl === undefined || (typeof $scope.ngivrUrl === 'string' && $scope.ngivrUrl !== '')) {
                //console.warn('ngivr list query with ngivr url', $scope.ngivrUrl)
                this.query();
            }

            $scope.command = {
                refresh: this.query.bind(this),
                clear: this.clear.bind(this),
                remove: this.remove.bind(this),
                swipe: this.swipe.bind(this),
            };


            $scope.ngivrRef.ngivrListCommand = $scope.command;


        }
    }
})
