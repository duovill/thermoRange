angular.module('ngIvrApp')
    .factory('socket', function ($injector, $rootScope, $http, $cookies, socketFactory, ngivrLoader, $injector) {

//    console.log('ngivr-socket (socket) factory')

        let electronSocketId;
        let electronWeighingHouse;
        let electronWeighingHouse2;

        const lockId = ngivr.nextId()

        let subscribers = [];
//        let connected = false;

        // socket.io now auto-configures its connection when we ommit a connection url
        const ioOptions = {
            // Send auth token on connection, you will need to DI the Auth service above
            rejectUnauthorized: false,
            path: '/socket.io',
            transports: ['websocket'],
            secure: true,
        }
        Object.defineProperty(ioOptions, 'query', {
            get: () => {
                return 'token=' + $cookies.get('token') + '&lockId=' + lockId
            }
        })

        const ioClient = io.connect('', ioOptions);

        ioClient.lockId = lockId

        const ioClientWrap = socketFactory({
            ioSocket: ioClient
        })

        // console.log(ioClient.io.opts.query);

        const newToken = (data) => {
            if (typeof data === 'string') {
                ioClient.emit('token-new', data);
                return
            }
            ioClient.emit('token-new', data.token)
            c2c({
                action: 'authorization',
                user: data.user,
            })
        };

        const ngivrSubcribersCall = (subscribers, schema, type, item, data) => {
            if (Array.isArray(subscribers)) {
                subscribers.forEach(subscriber => {
                    if (subscriber.schema === schema) {
                        subscriber(type, item, data)
                    }
                })
            }
        }

        let mustReload = false
        let reconnect = false;
        ioClient.on('connect', function () {
            $cookies.put('ngivr-io-id', ioClient.id)
            if (reconnect) {

                if (mustReload) {
                    ngivr.growl.error('Bár a szerverrel a kapcsolat helyreállt. Várakózó kérések voltak, ezért mindenképpen töltse be újra az oldalt a böngésző frissítés gombjával, vagy a Ctrl+R billentyűkombinációval.', true)
                } else {
                   console.info('A szerverrel a kapcsolat helyrállt. Folytathatja a munkát.', true)
                }


                console.log('ngivr-socket (socket) RE-connected')
                //return;
            } else {
                console.log('ngivr-socket (socket) connected')
                decorateConsole()
            }

/*
            setInterval(() => {
                const ngivrLockService = $injector.get('ngivrLockService')
                if (ngivrLoader.counter > 0 || ngivrLockService.allLocks.mine.locks.length > 0) {
//                    ngivr.growl.warning('A szerverrel megszakadt a kapcsolat. A kapcsolat helyreállításához kérem töltse be újra az oldalt a böngésző frissítés gombjával, vagy a Ctrl+R billentyűkombinációval.', true)
                }
                console.log('socket disconnect counter', 'ngivrLoader.counter', ngivrLoader.counter, 'ngivrLockService.allLocks.mine.locks.length', ngivrLockService.allLocks.mine.locks.length)

            }, 100)
*/
            ioClient.on('disconnect', function() {
                const ngivrLockService = $injector.get('ngivrLockService')
                if (ngivrLoader.counter > 0 || ngivrLockService.allLocks.mine.locks.length > 0) {
                    ngivr.growl.warning('A szerverrel megszakadt a kapcsolat. Várakozó kérések voltak. A kapcsolat helyreállításához kérem töltse be újra az oldalt a böngésző frissítés gombjával, vagy a Ctrl+R billentyűkombinációval.', true)
                    mustReload = true
                } else {
                    console.info('A szerverrel megszakadt a kapcsolat. Kérem várja meg, amíg a kapcsolat automatikusan helyreáll. Várakozó kérések nem voltak.', true)
                }
                console.log('socket disconnect counter', 'ngivrLoader.counter', ngivrLoader.counter, 'ngivrLockService.allLocks.mine.length', ngivrLockService.allLocks.mine.locks.length)

                //                let info = 'A folyamatos kapcsolat megszakadt, az oldalt lehet újra be kell tölteni.';
//                if (ngivr.config.dev) {
                    //info += '<br/><br/>DEV: Akkor kell raklikkelni, hogy OK, ha a szerver mar ujra betolte magat.'
//                }
//                ngivr.growl.info(info)
//                location.reload(true)
            });
//            newToken($cookies.get('token'));
//            console.log(subscribers.length);

            // this is only singleton, because it requires authorization
            // we have to send it every connection
            // the other socketio connect 2 connect communication
            // we can leave it just once
            // (probably :/ )
            ioClient.removeAllListeners('ngivr-c2c-connected')
            ioClient.on('ngivr-c2c-connected', function(data) {
                electronSocketId = data.socketId;
                console.log('ngivr-c2c-connected', data)
                c2c({
                    action: 'authorization',
                    data: {
                        user: $rootScope.user.hasOwnProperty('toJSON') ? $rootScope.user.toJSON() : $rootScope.user,
                    }
                })
            })


            reconnect = true;
        })

        let consoleOriginals = {}
        const decorateConsole = () => {
            const types = ['debug', 'info', 'log', 'warn', 'error'];

            for(let type of types) {
                consoleOriginals[type] = console[type];
                console[type] = function() {
                    consoleOriginals[type].apply(console, arguments)
                    const argsArray = JSON.parse(JSON.prune(Array.from(arguments)))
                    ioClient.emit('ngivr-client-log', {
                        type: type,
                        arguments:  argsArray,
                    })
                }
            }
        }

        ioClient.on('ngivr-c2c-weighing-house', async function(actionData) {

//                if (electronWeighingHouseFirst === true || actionData.weighingHouse !== electronWeighingHouse) {
            electronWeighingHouse = actionData.weighingHouse;

            if (electronWeighingHouse === '' || electronWeighingHouse === undefined || electronWeighingHouse === 'undefined' || electronWeighingHouse === 'null' || electronWeighingHouse === null) {
                ngivr.growl.error('A mérlegház nincs beállítva.', true)
                $rootScope.weighingHouse = undefined;
            } else {
                if (!$rootScope.user.hasOwnProperty('_id')) {
                    ngivr.growl('A mérlegház nincs beállíva, mert a felhasználó nincs belépve.')
                    return;
                }
                try {
                    const response = await $http.post('/data/weighing-house/id/' + electronWeighingHouse, {populate: ngivr.settings.populate.weighingHouse})
                    ngivr.growl(`A mérlegház be lett állítva: ${response.data.doc.name}`, true)
                    $rootScope.weighingHouse = response.data.doc;
                } catch(e) {
                    $rootScope.weighingHouse = undefined;
                    ngivr.growl.error(`Nincs ilyen mérlegház: ${electronWeighingHouse}.`, true)
                    ngivr.growl.error(e, true)

                }
            }

            electronWeighingHouse2 = actionData.weighingHouse2;
            if (electronWeighingHouse2 === '' || electronWeighingHouse2 === undefined || electronWeighingHouse2 === 'undefined' || electronWeighingHouse2 === 'null' || electronWeighingHouse2 === null) {
                ngivr.growl.info('A mérlegház 2 nincs beállítva.', true)
                $rootScope.weighingHouse2 = undefined;
            } else {
                if (!$rootScope.user.hasOwnProperty('_id')) {
                    ngivr.growl('A mérlegház 2 nincs beállíva, mert a felhasználó nincs belépve.')
                    return;
                }
                try {
                    const response = await $http.post('/data/weighing-house/id/' + electronWeighingHouse2, {populate: ngivr.settings.populate.weighingHouse})
                    ngivr.growl(`A mérlegház 2 be lett állítva: ${response.data.doc.name}`, true)
                    $rootScope.weighingHouse2 = response.data.doc;
                } catch(e) {
                    $rootScope.weighingHouse2 = undefined;
                    ngivr.growl.error(`Nincs ilyen mérlegház 2: ${electronWeighingHouse}.`, true)
                    ngivr.growl.error(e, true)

                }
            }

//                } else if (electronWeighingHouseFirst === false) {
//                    console.log('socket ngivr-c2c-weighing-house: already existing ')
//                }
//            console.log('ngivr-io-arabesque socket connection', arguments)
        })


        for(let event of ['error', 'connect_error']) {
            ioClient.on(event, function (error) {
                console.error(error);
                if (error === 'unauthorized') {
                    const Auth = $injector.get('Auth');
                    Auth.logout();
                }
            })
        }

        const c2c = (data) => {
            if (electronSocketId !== undefined) {
                const sendData = Object.assign({
                    toIoId: electronSocketId,
                }, data)
//                console.log(sendData);
                ioClient.emit('ngivr-c2c', sendData)
            } else {
                console.warn('socket.c2c electronSocketId === undefined, probably in the WEB (if electron, it is error!)?')
            }
        }

        const factory = {
            c2c: c2c,

            actionEvent: (options) => {
                return new Promise((resolve, reject) => {
                    options.requestId = ngivr.nextId();
                    ioClient.emit(options.event, options)
                    const responseEvent = `ngivr-response-${options.requestId}`;
                    const catchEvent = (data) => {
                        ioClient.removeListener(responseEvent, catchEvent)
                        if (data.hasOwnProperty('error')) {
                            reject(data.error);
                            return;
                        }
                        resolve(data)
                    };
                    catchEvent.ngivrId = options.requestId;
                    ioClient.on(responseEvent, catchEvent)
                })
            },

            getEvents: (schema) => {
                schema = _.camelCase(schema);
                return {
                    save: `${schema}:save`,
                    remove: `${schema}:remove`,
                    insertMany: `${schema}:insert-many`,
                }
            },

            newToken: newToken,

            socket: ioClient,

            ioClient: ioClient,

            ioClientWrap: ioClientWrap,
            socketWrap: ioClientWrap,

            /*
              subscribe: (subscriber) => {
                  subscribers.push(subscriber);
              },
              */

            /**
             * Register listeners to sync an array with updates on a model
             *
             * Takes the array we want to sync, the model name that socket updates are sent from,
             * and an optional callback function after new items are updated.
             *
             * @param {String} modelName
             * @param {Array} data
             * @param {Function} updateFunction
             */
            syncUpdates: function (modelName, data, updateFunction, subscribers) {
                const self = this;
                let $scope;

                if (typeof modelName === 'object' && modelName.hasOwnProperty('$parent')) {
                    $scope = modelName;
                    modelName = data;
                    data = updateFunction;
                    if (arguments.length > 2) {
                        if (Array.isArray(subscribers)) {
                            updateFunction = angular.noop;
                        } else {
                            updateFunction = arguments[3]
                        }
                    }
                }
                ngivr.console.group('NGIVR.SOCKET.SYNC-UPDATE: ' + modelName);
                ngivr.console.info(data.length);
                ngivr.console.group();

                updateFunction = updateFunction || angular.noop;

                modelName = _.camelCase(modelName)

                /**
                 * Syncs item creation/updates on 'model:save'
                 */
                const save = function (item) {
                    ngivr.console.group('NGIVR.SOCKET.SYNC-UPDATE: SAVE /' + modelName);
                    ngivr.console.info(item);
                    ngivr.console.group();

                    const oldItem = _.find(data, {_id: item._id});
                    const index = data.indexOf(oldItem);
                    let event = 'created';

                    // replace oldItem if it exists
                    // otherwise just add item to the collection
                    if (oldItem) {
                        data.splice(index, 1, item);
                        event = 'updated';
                    } else {
                        data.push(item);
                    }
                    updateFunction(event, item, data);
                    ngivrSubcribersCall(subscribers, modelName, event, item, data)

                };
                ioClient.on(modelName + ':save', save);


                /**
                 * Syncs item many creation on 'model:insert-many'
                 */
                const insertMany = function (response) {
                    ngivr.console.group('NGIVR.SOCKET.SYNC-UPDATE: INSERT-MANY /' + modelName);
                    ngivr.console.info(response);
                    ngivr.console.group();
                    for (let doc in response.docs) {
                        data.push(doc);
                    }
                    updateFunction('insert-many', response, data);
                    ngivrSubcribersCall(subscribers, modelName, 'insert-many', response, data)

                };
                ioClient.on(modelName + ':insert-many', insertMany);

                /**
                 * Syncs removed items on 'model:remove'
                 */
                const remove = function (item) {
                    ngivr.console.group('NGIVR.SOCKET.SYNC-UPDATE: DELETE /' + modelName);
                    ngivr.console.info(item);
                    ngivr.console.group();

                    const event = 'deleted';
                    _.remove(data, {_id: item._id});
                    updateFunction(event, item, data);
                    ngivrSubcribersCall(subscribers, modelName, event, item, data)

                };
                ioClient.on(modelName + ':remove', remove);

                if ($scope !== undefined) {
                    $scope.$on('$destroy', function () {
                        ioClient.removeListener(modelName + ':save', save);
                        ioClient.removeListener(modelName + ':remove', remove);
                        ioClient.removeListener(modelName + ':insert-many', insertMany);
                        ngivr.console.info('SOCKET-SYNC-REMOVE: ' + modelName);
                    });
                }
            },

            /**
             * Removes all listeners for a models updates on the socket
             *
             * @param modelName
             */
            unsyncUpdatesAll: function (modelName) {
                modelName = _.camelCase(modelName)
                ioClient.removeAllListeners(modelName + ':save');
                ioClient.removeAllListeners(modelName + ':remove');
                ioClient.removeAllListeners(modelName + ':insert-many');
            },
        };

        Object.defineProperty(factory, 'reconnect', {
            get: () => {
                return reconnect
            }
        })

        return factory
    });
