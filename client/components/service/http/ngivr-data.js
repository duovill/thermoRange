'use strict';
ngivr.angular.factory('ngivrData', (ngivrDataQuery, ngivrDataId, ngivrApi, socket) => {

    /**
     * Ez hasznalja az ngivr.api-t, ami nyers, ez meg beteszei a socket-io-t
     */
    return class {

        static query(options) {
            return new ngivrDataQuery(options);
        }


        static id(options) {
            return new ngivrDataId(options);
        }

        /**
         * Generates a socket io synched data.
         * Multiple execution usa the same data.
         *
         * @param {Object} options
         * @param {String} options.scope The $scope.
         * @param {String} options.schema The schema name from the server model.
         * @param {Function} options.update The update function - callback.
         */
        static all(options) {
            const $scope = options.scope;
            const subscribe = options.subscribe || angular.noop;


            if ($scope === undefined) {
                const error = Error(`ngivr.data.all constructor requires a 'scope' parameter`)
                ngivr.growl.error(error);
                throw new error;
            }


            const schema = _.camelCase(options.schema);

            if (this.factories === undefined) {
                this.factories = {};
            }
            if (this.factories[schema] === undefined) {
                this.factories[schema] = {
                    count: 0
                };
            }
            if (this.subscribers === undefined) {
                this.subscribers = [];
            }
            subscribe.schema = schema;
            this.subscribers.push(subscribe);

            const factory = this.factories[schema];

            if (factory.count === 0) {
                let resolveOut;
                let rejectOut;
                factory.response = new Promise((resolve, reject) => {
                    resolveOut = resolve;
                    rejectOut = reject;
                })
                factory.api = ngivrApi.query(schema, {
                    limit: 0, sort: {'name': 1}
                }).then((response) => {
                    socket.syncUpdates($scope, schema, response.data.docs, this.subscribers);
                    resolveOut(response);
                    return response;
                })
            }
            factory.count = factory.count + 1;

            if ($scope !== undefined) {
                $scope.$on('$destroy', () => {
                    this.allDestruct(schema, subscribe);
                });
            }

            ngivr.console.group(`NGIVR.DATA.ALL SCHEMA: ${schema}`);
            ngivr.console.log(`Count of usage: ${factory.count}`);
            ngivr.console.group();
            return factory.response.then((response) => {
                if (subscribe !== undefined) {
                    subscribe('update', response, response.data.docs);
                }
                return response.data.docs;
            });
        }

        /**
         * Removes the bindings for socket.
         * @param schema
         */
        static allDestruct(schema, subscribe) {
            schema = _.camelCase(schema);

            const factory = this.factories[schema];
            factory.count = factory.count - 1;
            if (this.subscribers.length > 0) {
                const findSubscribeIndex = this.subscribers.indexOf(subscribe);
                if (findSubscribeIndex > -1) {
                    this.subscribers = this.subscribers.splice(findSubscribeIndex, 1);
                }
            }

            if (factory.count === 0) {
                delete this.factories[schema];
            }

            ngivr.console.group(`NGIVR.DATA.ALLDESTRUCT Schema: ${schema}`);
            ngivr.console.log(`Count of usage: ${factory.count}`);
            ngivr.console.group();


        }
    }
});

