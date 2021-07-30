ngivr.angular.factory('ngivrLockService', (ngivrHttp, Auth, ngivrGrowl, socket, $rootScope, ngivrObserver, ngivrException, ngivrDebounce, $timeout) => {

    const redisLockEnv = ngivr.redisEnv;
    const interactionAutoUnlock = ngivr.settings.redisLock[redisLockEnv].timeout.interactionAutoUnlock;
    const defaultTtl = ngivr.settings.redisLock[redisLockEnv].timeout.ttl;

    console.log('NGIVR-LOCK-SERVICE factory environment', redisLockEnv, 'default ttl timeout', defaultTtl, 'interactive auto unlock timeout', interactionAutoUnlock)

    /*******************************
     * TTL MINIMUM: 60 seconds!!!!!!
     *******************************/

        // Ha egy művelet több lockot hoz létre, akkor a fő lock egy külön kérésben menjen, a többi a lockMore-ral

    const ioClient = socket.ioClient;

    let locksData = {
        locks: []
    };

    let locksDataMine = {
        locks: []
    }

    let locksDataOthers = {
        locks: []
    }


    let interactionUnlockTimeout;
    let interactionUnlockTimeoutWarning;

    return new function () {
        const self = this;
        this.defaultTtl = defaultTtl;
        this.interactionAutoUnlock = interactionAutoUnlock;

        this.decorateOnAutoUnlockOrError = (options) => {
            let { cancelFunction } = options;
            if (cancelFunction === undefined) {
                cancelFunction = () => {};
            }
            return async (options) => {
                const { error } = options;
                if (error) {
                    ngivrException.handler(error);
                }
                try {
                    await cancelFunction()
                } catch(error) {
                    ngivrException.handler(error);
                }
            }
        }

        this.decorateScopeLock = (options) => {
            const { scope, lock, type } = options
            let { functionName } = options
            if (!Array.isArray(functionName)) {
                functionName = [ functionName ]
            }
            functionName.forEach(functionNameInstance => {
                const originalFunction = scope[functionNameInstance];
//                console.warn('NGIVR-LOCK-SERVICE testing functions', functionNameInstance, typeof(scope[functionNameInstance]), originalFunction.toString());
                scope[functionNameInstance] = async function() {

//                    alert(`${functionNameInstance} ${type}`)

                    let hadError;
                    try {
                        if (type === 'lock') {
                            await lock.lock();
                        }
                        await originalFunction.apply(scope, arguments);

                        if (type === 'unlock') {
                            await lock.unlock();
                        }
                    } catch(e) {
                        hadError = e;
                    } finally {
                        if (hadError !== undefined) {
                            ngivrException.handler(hadError);
                            ngivrDebounce.scope.digest(scope)
                        }
                    }
                }
            })
        }

        this.generateSimpleResource = (schemaName, id) => {
            return `${_.camelCase(schemaName)}:${id}`
        }


        const parseAllLocks = (options) => {
            locksData = options.locksDataResponse;

//console.warn('locksDataResponse', locksDataResponse)
            // FIXME deprecated
            /**
             * @deprecated since version 0.6.300
             */

            if (options.hasOwnProperty('useDeprecated')) {
                locksDataMine.locks.forEach(myCurrentLock => {
                    let lockStillExists = false;
                    for (let currentLocks of locksData.locks) {
                        if (
                            currentLocks.id === ioClient.lockId &&
                            currentLocks.user === Auth.getCurrentUserId() &&
                            myCurrentLock.id === ioClient.lockId &&
                            myCurrentLock.user === Auth.getCurrentUserId()
                        ) {
                            lockStillExists = true;
                            break;
                        }
                    }
                    if (!lockStillExists) {
//                        ngivr.growl.info('NGIVR-LOCK-SERVICE: lock is removed');
//                        console.log('NGIVR-LOCK-SERVICE: lock is removed', myCurrentLock)
//                        console.log('NGIVR-LOCK-SERVICE: broadcast event', generatedEvent)
//                        /*

                        // FIXME deprecated
                        /**
                         * @deprecated since version 0.6.300
                         */
                        $rootScope.$broadcast(self.generateUnlockEvent(myCurrentLock.doc), myCurrentLock)
//                        */
                    }
                })
            }

            locksDataMine.locks = [];
            locksDataOthers.locks = [];

            locksData.locks.forEach(lock => {
                if (lock.id === ioClient.lockId && lock.user === Auth.getCurrentUserId()) {
                    locksDataMine.locks.push(lock);
                } else {
                    locksDataOthers.locks.push(lock);
                }
            })

            ngivr.console.group('NGIVR-LOCK-SERVICE:received')
            ngivr.console.log('all locks', locksData);
            ngivr.console.log('my locks', locksDataMine);
            ngivr.console.log('others locks', locksDataOthers);
            ngivr.console.group()
        }

        this.getAllLocks = async (options = {}) => {

            const data = await socket.actionEvent({
                event: 'ngivr-lock-request',
                action: 'get-all-locks',
            })
            console.warn(`ngivrLockService.getAllLocks`, data)

            if (typeof options === 'object' && options.hasOwnProperty('parsed') && options.parsed === true) {
                parseAllLocks({
                    locksDataResponse: data
                })
                return self.allLocks
            }

            return data.locks;
        }

        //FIXME deprecated
        /*
         * @deprecated since version 0.6.300
         */
        this.getLocks = () => {
            //RETURN A MAP!
            return this.locks;
        }

        Object.defineProperty(this, 'allLocks', {
            get: () => {
                return {
                    all: locksData,
                    others: locksDataOthers,
                    mine: locksDataMine
                }
            }
        })

        //FIXME deprecated
        /**
         * async lock - description
         *
         * @param  {string} resource dokumentum id, vagy bármi egyedileg azonosítható
         * @param  {number} [ttl] lock timeout in SECONDs, optional
         * @param  {function} [timeoutCallback] description, optional
         * @return {object} lockData object
         * @deprecated since version 0.6.300
         */
        this.lock = async (resource, ttl, timeoutCallback) => {
            if (typeof ttl === "function") {
                timeoutCallback = ttl;
                ttl = null;
            }
            try {
                let user = Auth.getCurrentUser()._id;
                let lockData = await ngivrHttp({
                    url: `/api/lock`,
                    method: 'POST',
                    data: {
                        resource: resource,
                        user: user,
                        ttl: ttl,
                        id: ioClient.lockId,
                    }
                });
                lockData = lockData.data;
                lockData.timeoutCallback = timeoutCallback;
                this.locks.set(lockData.resource, lockData);
                //ngivrGrowl.warning('A dokumentum zárolása sikeres');
                return lockData;
            } catch (err) {
                //ngivrGrowl.error('A kért dokumentumot nem sikerült zárolni!',true);

                throw err;
                // return false;
            }
        };

        //FIXME deprecated
        /**
         * Több lock létrehozása egyszerre
         * ezeket a lockokat a fő lock automatikusan oldani fogja,
         * ezért a ttl a defaultTtl négyszeresére van állítva,
         * így nem indul el az automatikus lock oldás
         * @param options
         * @returns {Promise<Array>}
         * @deprecated since version 0.6.300
         */
        this.lockMore = async (options) => {
            try {
                let toLockDatas = [];
                let lockDatas = [];
                let user = Auth.getCurrentUser()._id;
                for (let option of options) {
                    toLockDatas.push({
                        resource: option.resource ? option.resource : option,
                        user: user,
//                        ttl: 8*60*60, //8 óra
                        ttl: defaultTtl,
                        id: ioClient.lockId,
                    });


                }
                let lockedDatas = await ngivrHttp({
                    url: `/api/lock/lockMore`,
                    method: 'POST',
                    data: toLockDatas
                });
                lockedDatas = lockedDatas.data;
                for (let i in lockedDatas) {
                    lockedDatas[i].timeoutCallback = options[i].timeoutCallback;
                    this.locks.set(lockedDatas[i].resource, lockedDatas[i]);
                    lockDatas.push(lockedDatas[i])
                }
                // ngivrGrowl.warning('A szükséges dokumentumok zárolása sikeres');


                return lockDatas
            } catch (err) {
                // ngivrGrowl.error('A kért dokumentumokat nem sikerült zárolni!',true);

                throw err;
            }


        }


        // FIXME deprecated
        /**
         * async unlock - felold egy adott lockot
         *
         * @param  {string} resource dokumentum id, vagy bármi egyedileg azonosítható
         * @param {boolean} more
         * @return {object} lockData object
         * @deprecated since version 0.6.300
         */
        this.unlock = async (resource, more) => {
            try {
                // let user = this.locks.get(resource).value;
                let user = this.locks.get(resource);
                //ez lock már nem létezik
                if (!user) {
                    return;
                }
                user = user.value;
                let deleted = await ngivrHttp.delete(`/api/lock/${resource}/${user}`);
                deleted = deleted.data;
                this.locks.delete(deleted.resource);
                // 	if (!more) {
                //   ngivrGrowl.warning('A zárolt dokumentum feloldása sikeres');
                // }

                return deleted;
            } catch (err) {
                // ngivrGrowl.error('A zárolt dokumentum feloldása meghiúsult!')
                throw err;
                // return false;
            }
        }

        // FIXME deprecated
        /**
         *  több lockot old fel
         * @param {array} resources resource dokumentum id-k tömbje
         * @returns {Promise<*>}
         * @deprecated since version 0.6.300
         */
        this.unlockMore = async (resources) => {
            try {

                let locks = [];
                if (!resources) {
                    let myLocks = await this.getLocks();
                    for (let lock of myLocks) {
                        locks.push({resource: lock[0], user: lock[1].value});
                    }
                } else {
                    for (let resource of resources) {
                        let user = this.locks.get(resource.resource ? resource.resource : resource);
                        if (user) {
                            user = user.value;
                            locks.push({resource: resource.resource ? resource.resource : resource, user: user})
                        }
                    }
                }

                if (locks.length) {
                    let deletedLocks = await ngivrHttp.post('/api/lock/unlockMore', locks);
                    deletedLocks = deletedLocks.data;
                    for (let deleted of deletedLocks) {
                        this.locks.delete(deleted.resource);
                    }
                    // ngivrGrowl.warning('Minden zárolt dokumentum feloldásra került');
                    return deletedLocks
                }
            } catch (err) {
                throw err
            }
        }

        let recordInteractionDebounce

        /**
         * recordInteraction - az utolsó felhasználói interakció ideje
         * utility function
         *
         * @return {void}
         */
        this.recordInteraction = () => {
            $timeout.cancel(interactionUnlockTimeout);
            $timeout.cancel(interactionUnlockTimeoutWarning);

            const findLockedUser = () => {
                let foundLockedUser = false;
                for (let lock of locksData.locks) {
//ngivr.console.log('findLockedUser and socket.io', lock)
//ngivr.console.log('findLockedUser', lock, lock.user, Auth.getCurrentUserId(), lock.user === Auth.getCurrentUserId())
                    if (lock.user === Auth.getCurrentUserId() && lock.id === socket.ioClient.lockId) {
                        foundLockedUser = true;
                        break;
                    }
                }
                return foundLockedUser;
            }

            interactionUnlockTimeout = $timeout(() => {

                ngivr.console.group('NGICR-LOCK: interaction auto unlock')
                ngivr.console.log('Auto unlock on', new Date(this.autoUnlockInteraction).toLocaleString())
                ngivr.console.log('Locks existing', locksData.locks)

                if (findLockedUser()) {

                    ngivr.console.log('Locks found, auto unlock executed.')
                    ngivr.growl.error('Ebben a böngésző tabban, minden saját szerkeszthető form automatikus be lett zárva és az adatok elvesztek.', true)

                    self.emitAutoUnlockInteraction();
                } else {
                    ngivr.console.log('No locks, no auto unlock executed.')
                }

                ngivr.console.group()

            }, interactionAutoUnlock * 1000)

            interactionUnlockTimeoutWarning = $timeout(() => {
                if (findLockedUser()) {
                    ngivr.growl.warning('Ha nem lesz interakció ebben a böngésző tabban, akkor a szerkeszthető formok automatikusan be lesznek zárva és az adatok elvesznek, pontosan ' + (new Date(this.autoUnlockInteraction).toLocaleString()) + '-kor, hogy másnak ne kelljen várni.', true)
                }
            }, Math.ceil(interactionAutoUnlock / 2) * 1000)

            $timeout.cancel(recordInteractionDebounce);
            recordInteractionDebounce = $timeout(() => {
                //ngivr.console.group('NGIVR-LOCK-SERVICE: interaction update')
                this.activityTime = Date.now();
                this.autoUnlockInteraction = this.activityTime + (interactionAutoUnlock * 1000);
                //ngivr.console.log('Latest interaction on', new Date(this.activityTime).toLocaleString());
                //ngivr.console.log('Next time auto unlock on', new Date(this.autoUnlockInteraction).toLocaleString())
                //ngivr.console.group();
            }, ngivr.settings.debounce)
        }

        // FIXME deprecated
        /**
         * @deprecated since version 0.6.300
         */
        this.generateUnlockEvent = (resource) => {
            return `ngivr-lock-unlock-${resource}`
        }

        // FIXME deprecated
        /**
         * @deprecated since version 0.6.300
         */
        this.catchUnlockCallback = ($scope, resource, callback) => {
            if (callback !== undefined) {
                return $scope.$on(self.generateUnlockEvent(resource), callback)
            }
            return angular.noop;
        }

//    console.log('NGIVR-LOCK-SERVICE factory constructor')

        this.locks = new Map();

        let handler = this.recordInteraction.bind(this);
        document.addEventListener("keydown", handler);
        document.addEventListener("click", handler);
        document.addEventListener("scroll", handler);
        handler();

        let nextAutoEmitSentLocks;


        ioClient.on('connect', function () {
            console.log('ngivr-lock-service connect')
//      console.log('NGIVR-LOCK-SERVICE factory constructor: ngivr-socket (socket) connected')
            const getLocks = (locksDataResponse) => {
                console.log('ngivr-lock-service  ngivr-lock-response-get-locks')
                parseAllLocks({
                    locksDataResponse: locksDataResponse,
                    useDeprecated: true,
                });

//        console.log('locksData', locksData);
                // find out the last lock
                //IMPORTANT the NGIVR-LOCK-SERVICE is connected to ngivr-form here
                $timeout.cancel(nextAutoEmitSentLocks);
                let minTtlWithSetTimeout;
                locksData.locks.forEach(lock => {
//          console.log(lock)
                    minTtlWithSetTimeout = minTtlWithSetTimeout === undefined || lock.timeout < minTtlWithSetTimeout ? lock.timeout : minTtlWithSetTimeout;
                })
//        console.log('minTtlWithSetTimeout', minTtlWithSetTimeout)
                if (minTtlWithSetTimeout !== undefined) {

                    //IMPORTANT the auto emit lock timeout must be longer time than auto renew lock timeout
                    const nextAutoEmitSentLocksSetTimeoutMilis = Math.max((minTtlWithSetTimeout - 5), 5) * 1000;
                    console.log('NGIVR-LOCK-SERVICE: auto emit-locks will in ', Math.ceil(nextAutoEmitSentLocksSetTimeoutMilis / 1000), 'seconds');
                    nextAutoEmitSentLocks = $timeout(() => {
                        ngivr.console.log('NGIVR-LOCK-SERVICE:auto emit-locks');
                        self.emitLocks();
                    }, nextAutoEmitSentLocksSetTimeoutMilis)
                } else {
                    ngivr.console.log('NGIVR-LOCK-SERVICE:auto emit-locks is disabled, no lock existing');
                }


                ngivrObserver.get({
                    factory: 'ngivrLock',
                }).forEach(subscriber => {
                    subscriber(locksData, locksDataMine, locksDataOthers)
                })
            };
            ioClient.removeAllListeners('ngivr-lock-response-get-locks')
            ioClient.on('ngivr-lock-response-get-locks', getLocks)
            self.emitLocks();
        })

        // FIXME deprecated
        /**
         * @deprecated since version 0.6.300
         */
        this.subscribeMore = (options) => {
            const {resources, onUnsubscribe} = options;
            // disable execute unsubscribe multiple times
            onUnsubscribe.executed = false;
            resources.forEach(resourceInfo => {
                const moreLockSubscriber = (locksData, locksDataMine, locksDataOthers) => {
                    let foundLock = false;
                    for (let lock of locksDataMine.locks) {
                        if (lock.doc === resourceInfo.resource) {
                            foundLock = true;
                            break;
                        }
                    }
                    if (foundLock === false) {
                        self.unsubscribe(moreLockSubscriber)
                        if (onUnsubscribe !== undefined && onUnsubscribe.executed === false) {
                            onUnsubscribe.executed = true
                            onUnsubscribe()
                        }
                    }
                }
                self.subscribe(moreLockSubscriber)
            })

        }

        this.subscribe = (subscriber) => {
            const subscribed = ngivrObserver.subscribe({
                factory: 'ngivrLock',
                subscriber: subscriber,
            })
            if (subscribed) {
                subscriber(locksData, locksDataMine, locksDataOthers);
            }
        };

        this.unsubscribe = (subscriber) => {
            ngivrObserver.unsubscribe({
                factory: 'ngivrLock',
                subscriber: subscriber,
            })
//            this.emitLocks();
        }

        let emitLockDebounce = undefined;
        this.emitLocks = (loadCurrentLockBySubscriber) => {
            if (loadCurrentLockBySubscriber !== undefined) {
                loadCurrentLockBySubscriber(locksData, locksDataMine, locksDataOthers)
            }
            $timeout.cancel(emitLockDebounce)
            emitLockDebounce = $timeout(() => ioClient.emit('ngivr-lock-request-get-locks'), ngivr.settings.debounce)
        }

        // FIXME deprecated
        /**
         * @deprecated since version 0.6.300
         */
        this.emitRenew = (lockData) => {
            ioClient.emit('ngivr-lock-request-extend-lock', lockData);
        }

        this.emitAutoUnlockInteraction = () => {
            ioClient.emit('ngivr-lock-request-interaction-auto-unlock');
        }



    }
});
