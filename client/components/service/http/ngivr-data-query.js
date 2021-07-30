'use strict';
ngivr.angular.factory('ngivrDataQuery', (ngivrApi, socket, $timeout, ngivrException) => {

    return class {

        constructor(options) {

            this.loaded = false;

            this.first = false;


            this.debounceCount = 0;
            this.debounceTimeout = undefined;

            const $scope = options.$scope;

            const schema = options.schema;
            const union = options.union

            const LOG = `NGIVR.DATA.QUERY: ${schema}`;

            const hasSubscribe = options.subscribe !== undefined && options.subscribe !== null
            const noScope = (options.$scope === undefined || options.$scope === null) && options.$scope !== 'user-destory'

            if (options.scope !== undefined) {
                const infoScope = `${LOG} a $scope parameterje nem 'scope', hanem '$scope'!`
                ngivr.growl.error(infoScope)
                console.error(infoScope)
            }

            options.events = {
                socket: socket.getEvents(schema)
            };

            options.listeners = {
                socket: {
                    save: async(data) => {
                        try {
                            ngivr.console.log(`${LOG} save`)
                            await this.query(undefined, true);
                            $scope.$digest()
                        } catch(e) {
                            ngivrException.handle(e)
                        }
                    },
                    remove: async(data) => {
                        try {
                            ngivr.console.log(`${LOG} remove`)
                            await this.query(undefined, true);
                            $scope.$digest()
                        } catch(e) {
                            ngivrException.handle(e)
                        }
                    },
                    insertMany: async(response) => {
                        try {
                            ngivr.console.log(`${LOG} insert many`)
                            await this.query(undefined, true);
                            $scope.$digest()
                        } catch(e) {
                            ngivrException.handle(e)
                        }
                    },
                    updateMany: async(response) => {
                        try {
                            ngivr.console.log(`${LOG} update many`)
                            await this.query(undefined, true);
                            $scope.$digest()
                        } catch(e) {
                            ngivrException.handle(e)
                        }
                    }
                },
                $destroy: undefined
            };
            socket.socket.on(options.events.socket.save, options.listeners.socket.save);
            socket.socket.on(options.events.socket.remove, options.listeners.socket.remove);
            socket.socket.on(options.events.socket.insertMany, options.listeners.socket.insertMany);
            socket.socket.on(options.events.socket.updateMany, options.listeners.socket.updateMany);

            if ($scope !== undefined && $scope !== null && $scope !== 'user-destroy') {
                options.listeners.$destory = $scope.$on('$destroy', () => {
                    ngivr.console.log(`${LOG} unsubscribe`);
                    this.unsubscribe();
                });
            }

            if (hasSubscribe && noScope) {
                const info = `${LOG} -ban van subscribe, de nincs megada a $scope parameter, ez hiba, kerem tegye be! Ha kezzel hivja meg az unsubscribe-ot, akkor a $scope parameter legyen 'user-destroy'.`
                ngivr.growl.error(info)
                console.error(info)
            }

            this._options = options;
        }

        query(query, silent = false) {
            this.debounceCount++;
            if (this.options.url) { //debughoz
                console.warn('VAN NGIVRURL', this.options.url)
            }
            this.options.query = query || this.options.query;
            const actualQuery = () => {
                const promise = ngivrApi.query(this.options.schema, this.options.query, this.options.url, this.options.union, silent).then((response) => {
                    this.debounceCount = 0;
                    this.options.query = response.data;
                    this.ensureWatches();
                    return response;
                })
                if (this.options.subscribe !== undefined) {
                    this.options.subscribe(promise);
                }
                return promise;
            }

            const theFirstDebounceClick = 1;

            const reRun = (resolve) => {
                $timeout.cancel(this.debounceTimeout);
                this.debounceTimeout = $timeout(() => {
                    if (this.debounceCount === theFirstDebounceClick) {
                        resolve(actualQuery());
                    } else {
                        this.debounceCount = theFirstDebounceClick;
                        reRun(resolve);
                    }
                }, ngivr.settings.debounce);
            }

            if (!this.first) {
                this.first = true;
                this.options.promise = actualQuery();
            } else if (this.debounceCount === theFirstDebounceClick) {
                this.options.promise = new Promise((resolve, reject) => {
                    reRun(resolve, reject)
                });
            } else if (this.debounceCount === 1) {
                this.options.promise = actualQuery();
            }

            this.first = true;
            return this.options.promise;
        }

        get options() {
            return this._options;
        }


        get promise() {
            return this._options.promise;
        }

        unsubscribe(options) {
            socket.socket.removeListener(this.options.events.socket.save, this.options.listeners.socket.save);
            socket.socket.removeListener(this.options.events.socket.remove, this.options.listeners.socket.remove);
            socket.socket.removeListener(this.options.events.socket.insertMany, this.options.listeners.socket.insertMany);
            socket.socket.removeListener(this.options.events.socket.updateMany, this.options.listeners.socket.updateMany);

            if (this.options.listeners.$destory !== undefined) {
                this.options.listeners.$destory();
            }
            if (options && options.callback) {
                return options.callback()
            }
        }


        ensureWatches() {
            const self = this;
            const options = this.options;

            if (!this.loaded) {
                const $scope = options.$scope;

                this.loaded = true;

                if (options.scopeQuery === undefined) {
                    return;
                }

                const firstRequery = {};
                let requery = (type) => {

                    const showLog = ({ oldValueJson, newValueJson, type, info}) => {
                        ngivr.console.group(`NGIVR.DATA.QUERY.REQUERY ${type} - ${info}`);
                        ngivr.console.log('Old value', oldValueJson);
                        ngivr.console.log('New value', newValueJson);
                        ngivr.console.group();
                    }

                    return (newValue, oldValue) => {

                        const newValueJson = JSON.stringify(newValue);
                        const oldValueJson = JSON.stringify(oldValue);


                        if (!firstRequery.hasOwnProperty(type)) {
                            firstRequery[type] = 0;
                            showLog({ oldValueJson, newValueJson, type, info: 'not executed'})
                            return
                        }
                        firstRequery[type]++;
                        if (firstRequery[type] < 2) {
                            showLog({ oldValueJson, newValueJson, type, info: 'not executed'})
                            return
                        }
                        if (newValueJson === oldValueJson || !self.loaded) {
                            showLog({ oldValueJson, newValueJson, type, info: 'not executed'})
                            return;
                        }

                        showLog({ oldValueJson, newValueJson, type, info: 'EXECUTED'})

                        self.query($scope[options.scopeQuery]);
                        ngivr.console.group();
                    }
                };

                const watches = [
                    `${options.scopeQuery}.limit`,
                    `${options.scopeQuery}.search`,
                    `${options.scopeQuery}.page`,
                    `${options.scopeQuery}.sort`,
                    `${options.scopeQuery}.settings.searchModeStartsWith`,
                    `${options.scopeQuery}.settings.isClosed`,
                ];


                watches.forEach((watch) => {
                    $scope.$watch(watch, requery(watch));
                })

            }

        }

    }


});

