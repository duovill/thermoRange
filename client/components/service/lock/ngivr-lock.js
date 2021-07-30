ngivr.angular.factory('ngivrLock', (Auth, socket, ngivrException, ngivrLockService, ngivrDebounce, $timeout) => {


    const counter = new function () {
//        const overlay = $(`#ngivr-overlay-lock`);
        //       const overlayCount = $(`#ngivr-overlay-lock-counter`);
        let count = 0;
//        let overlayTimeout;

        Object.defineProperty(this, 'count', {
            get: () => count,
        })

        this.add = (add = 1) => {
//            $timeout.cancel(overlayTimeout)
            count += add
//            overlayCount.text(count)
//            ngivr.growl(`ngivr-lock count: ${count}`)
//            if (count > 0) {
//                overlay.show();
//            }
        }

        this.subtract = (subtract = 1) => {
            count -= subtract
//            overlayCount.text(count)
//            ngivr.growl(`ngivr-lock count: ${count}`)
//            if (count === 0) {
//                $timeout.cancel(overlayTimeout)
//                overlayTimeout = $timeout(() => {
//                    overlay.hide();
//                }, 50)
//            }
        }

        this.increase = () => {
            this.add()
        }

        this.decrease = () => {
            this.subtract();
        }

    }

    let globalAutoRenewMap = {}
    let globalRenewTimeout;
    let globalRenewTimeMs;

    const factory = (options) => {

        try {

            const instanceId = `${ngivr.nextId()}`

            const generateResourceError = (currentResource) => {
                return new Error(`NGIVR-LOCK: the resource must be either a string, array or undefined, the array of item must have a resource property - [ { resource: resourceId } ] - GOT: ${JSON.stringify(currentResource)}`);
            }

            const validateResourceAndToArray = (validateResource) => {
                if (Array.isArray(validateResource)) {
                    const validatedResourceId = [];
                    const validatedResource = [];
                    for (let resourceItem of validateResource) {
                        if (!resourceItem.hasOwnProperty('resource')) {
                            throw generateResourceError(validateResource);
                        }
                        if (!validatedResourceId.includes(resourceItem.resource)) {
                            validatedResourceId.push(resourceItem.resource)
                            validatedResource.push(resourceItem)
                        }
                    }
                    return validatedResource;
                }
                if (validateResource === undefined) {
                    return [];
                }
                if (typeof validateResource !== 'string') {
                    throw generateResourceError(validateResource);
                }
                return [
                    {
                        resource: validateResource
                    }
                ]
            }

            let {scopeDecorator, resource, scope, onAutoUnlock, onUnlock, onError, onAutoUnlockOrError, watchId, schema, watchEditing, emitAndUpdateScope, useDestroy, doc} = options;


            if (emitAndUpdateScope === undefined) {
                emitAndUpdateScope = true;
            }
            if (useDestroy === undefined) {
                useDestroy = true;
            }

            resource = validateResourceAndToArray(resource);

            return new function () {

                if (typeof(scopeDecorator) === 'object') {
                    if (scopeDecorator.hasOwnProperty('onAutoUnlockOrError')) {
                        onAutoUnlockOrError = ngivrLockService.decorateOnAutoUnlockOrError({
                            cancelFunction: scopeDecorator.onAutoUnlockOrError.cancelFunction
                        })
                    }
                    if (scopeDecorator.hasOwnProperty('unlock')) {
                        $timeout(() => {
                            ngivrLockService.decorateScopeLock({
                                type: 'unlock',
                                scope: scope,
                                functionName: scopeDecorator.unlock.functionName,
                                lock: this,
                            })
                        })
                    }
                    if (scopeDecorator.hasOwnProperty('lock')) {
                        $timeout(() => {
                            ngivrLockService.decorateScopeLock({
                                type: 'lock',
                                scope: scope,
                                functionName: scopeDecorator.lock.functionName,
                                lock: this,
                            })
                        })
                    }
                }

                if (typeof onAutoUnlockOrError === 'function') {
                    onError = onAutoUnlockOrError;
                    onAutoUnlock = onAutoUnlockOrError;
                }

                const self = this;
                const user = Auth.getCurrentUser();
                const userId = user._id;
                this._locked = false;
                this.initialized = false;
                this.lockedNickname = undefined;
                this.renewTimeout = undefined;
                this.locks = [];
                this.locksMySubcribed = [];
                this.type = 'lock';
                this.ngivrLockService = ngivrLockService;

                this.resource = resource;

                this.editing = false;

                this.selfLocked = false;

                this.currentId = undefined;

                if (typeof watchId === 'string' && typeof schema === 'string') {

                    scope.$watch(watchId, async (newvalue, oldvalue) => {
                        if (newvalue === undefined) {
                            try {
                                await this.unlock();
                            } catch (e) {
                                ngivrException.handler(e)
                            }
                            return;
                        }

                        if (this.currentId !== newvalue && this.editing) {

                            try {
//console.trace('unlock and lock now', ngivrLockService.generateSimpleResource(schema, newvalue))
                                // console.log('lock again not good multiple times!!!!')
                                await this.unlock();

                                this.setResource(
                                    ngivrLockService.generateSimpleResource(schema, newvalue)
                                )

                                await this.lock();
                                this.currentId = newvalue;
                            } catch (e) {
                                ngivrException.handler(e)

                            }
                        } else {
                            this.setResource(
                                ngivrLockService.generateSimpleResource(schema, newvalue)
                            )
                        }
                    })
                }

                if (typeof watchEditing === 'string') {
                    scope.$watch(watchEditing, async (newvalue, oldvalue) => {
                        try {
                            this.editing = newvalue || false;
                            //console.log('watchEditing', watchEditing, newvalue, 'this.editing', this.editing);
                        } catch (e) {
                            ngivrException.handler(e)
                        }
                    })
                }

                Object.defineProperty(this, "locked", {
                    get: () => {
                        if (!this.initialized) {
                            return true;
                        }
                        return this._locked
                    }
                });

                this.updateScope = () => {
                    ngivrDebounce.scope.digest(scope);
                }

                const subscriber = (locksData, myLocksDataOriginal, theirLocksDataOriginal) => {

                    const myLocksData = {
                        locks: []
                    }

                    const theirLocksData = ngivr.json.clone(theirLocksDataOriginal);

                    myLocksDataOriginal.locks.forEach(lock => {
                        if (lock.instanceId === instanceId) {
                            myLocksData.locks.push(lock);
                        } else {
                            theirLocksData.locks.push(lock);
                        }
                    })

                    this._locked = false;
                    this.locksMySubcribed = myLocksData;

                    let foundLock = undefined;
                    for (let theirLockData of theirLocksData.locks) {
                        for (let resourceItem of this.resource) {
                            if (theirLockData.doc === resourceItem.resource) {
                                foundLock = theirLockData;
                                break;
                            }
                        }
                        if (foundLock !== undefined) {
//console.warn('foundLock', foundLock)
//console.warn('my lock', this.resource, myLocksData)
                            break;
                        }
                    }
                    if (foundLock !== undefined) {
//                        console.log('found lock', foundLock, this.resource, foundLock)
                        this._locked = true;
                        this.lockedNickname = foundLock.nickName
                    } else {
                        this._locked = false;
                        this.lockedNickname = undefined
                    }

                    let myLockMissing = [];
                    for (let instanceMyLockData of this.locks) {
                        let foundLockFromMyData = false;
                        for (let myLockData of myLocksData.locks) {
                            if (instanceMyLockData.resource === myLockData.doc) {
                                foundLockFromMyData = true;
                                break;
                            }
                        }
                        if (!foundLockFromMyData) {
                            myLockMissing.push(instanceMyLockData)
                        }
                    }

                    let renewTimeoutMilliseconds;

                    if (myLockMissing.length > 0) {
                        if (typeof onAutoUnlock === 'function') {
//                            ngivr.growl(`ngivr-lock: auto unlock  ${this.type}`)
                            onAutoUnlock({
                                doc: doc
                            })
                        }
                        /*
                        if (typeof onUnlock === 'function') {
//                            ngivr.growl(`ngivr-lock: unlock  ${this.type}`)
                            onUnlock({});
                        }
                        */
                        this.locks = [];
                    } else if (myLocksData.locks.length > 0) {
                        let oneLock;
                        for (let myLockInstance of myLocksData.locks) {
                            //console.log(myLockInstance.doc, this.resource[0].resource)
                            for (let myCurrentLockInstance of this.resource) {
                                if (myLockInstance.doc === myCurrentLockInstance.resource && (oneLock === undefined || myLockInstance.timeout < oneLock.timeout)) {
                                    oneLock = myLockInstance
                                }
                            }
                            if (oneLock !== undefined) {
                                break;
                            }
                        }
                        if (oneLock !== undefined) {
                            let generatedTimeout = Math.floor(oneLock.timeout - (oneLock.timeout / 2));
                            renewTimeoutMilliseconds = Math.max(generatedTimeout * 1000, 0);
                            const info = `found onelock generatedTimeout: ${generatedTimeout}, renewtime: ${renewTimeoutMilliseconds / 1000}, globalRenewTime: ${globalRenewTimeMs / 1000}`;

                            ngivr.console.log(info)
// ngivr.growl(info);

                            globalAutoRenewMap[instanceId] = this.lockExtend;

//                            ngivr.growl('autorenew!!!')

                            $timeout.cancel(globalRenewTimeout)

                            if (globalRenewTimeMs === undefined || renewTimeoutMilliseconds < globalRenewTimeMs) {
                                globalRenewTimeMs = renewTimeoutMilliseconds
                            }
                            console.log('ngivr-lock:will renew', globalRenewTimeMs / 1000, Object.keys(globalAutoRenewMap))
                            globalRenewTimeout = $timeout(() => {
                                console.log('ngivr-lock:now renewing', Object.keys(globalAutoRenewMap))
                                for (let globalAutoRenewMapInstance of Object.values(globalAutoRenewMap)) {
//    console.log(globalAutoRenewMapInstance);
                                    globalAutoRenewMapInstance();
                                }
                                globalRenewTimeMs = undefined;
                                globalAutoRenewMap = {};
                            }, globalRenewTimeMs)
                        }
                        /*
                        $timeout.cancel(this.renewTimeout);
                        this.renewTimeout = $timeout(() => {
                            generateLog('renewing now')
                            this.lockExtend()
                        }, renewTimeoutMilliseconds)
                        */

                    }

                    if (renewTimeoutMilliseconds === undefined) {
                        delete globalAutoRenewMap[instanceId]
//                    if (this.renewTimeout === undefined) {
//                        ngivr.console.log(`NGIVR-LOCK-INSTANCE-ID:${instanceId} - renewing disabled, not editing`)
                    }

                    //TODO tuning , only update scope if data changed
                    this.updateScope();
                }

                ngivrLockService.subscribe(subscriber)
                this.initialized = true;

                if (useDestroy) {
                    scope.$on('$destroy', async () => {
                        $timeout.cancel(this.renewTimeout);
                        scope = undefined;
                        try {
                            await self.destroy()
                        } catch (e) {
                            ngivrException.handler(e);
                            throw e;
                        } finally {
                            ngivrLockService.emitLocks()
                        }
                    })
                }


                this.loadResource = (options) => {
                    let {resource, override} = options
                    if (override === true) {
                        this.resource = validateResourceAndToArray(resource)
                    } else {
                        this.resource = validateResourceAndToArray(this.resource.concat(validateResourceAndToArray(resource)));
                    }
                    // have to load emit
                    ngivrLockService.emitLocks(subscriber);
                }

                this.clear = async () => {
                    try {
                        await this.unlock()
                    } catch (e) {
                        ngivrException.handler(e);
                    } finally {
                        this.resource = [];
                    }
                }

                const ensureOptionsResource = (options) => {
                    if (typeof options === 'string') {
                        return {
                            resource: options
                        }
                    }
                    return options;
                }

                this.setResource = (options) => {
                    options = ensureOptionsResource(options)
                    options.override = true;
                    this.loadResource(options);
                }

                this.addResource = (options) => {
                    options = ensureOptionsResource(options)
                    options.override = false;
                    this.loadResource(options);
                }

                this.destroy = async () => {
                    $timeout.cancel(this.renewTimeout);
                    scope = undefined;
                    try {
                        // unlock everything
                        await self.unlock();
                    } catch (e) {
                        ngivrException.handler(e);
                        throw e;
                    } finally {
                        // unsubscribe
                        ngivrLockService.unsubscribe(subscriber)
                    }
                }

                this.lock = async (options = {}) => {
                    let {extend} = options;
                    if (extend === undefined) {
                        extend = false;
                    }
                    if (!extend) {
                        counter.increase()
                    }
                    try {
//                        alert(emitAndUpdateScope)
                        const data = await socket.actionEvent({
                            event: 'ngivr-lock-request',
                            action: 'lock',
                            emit: emitAndUpdateScope,
                            resource: this.resource,
                            userId: userId,
                            ttl: ngivrLockService.defaultTtl,
                            id: socket.ioClient.lockId,
                            instanceId: instanceId,
                            extended: extend,
                            locksMySubcribed: this.locksMySubcribed,
                        })
                        this.locks = data.locks;

                    } catch (e) {
                        if (typeof onError === 'function') {
                            onError({
                                doc: doc,
                                error: e,
                            })
                        }
                        ngivrException.handler(e);
                        throw e;
                    } finally {
                        if (emitAndUpdateScope) {
                            this.updateScope();
                        }

                        if (!extend) {
                            counter.decrease()
                        }
                    }
                }

                this.lockExtend = () => {
                    this.lock({
                        extend: true,
                    })
                }

                this.unlock = async () => {
                    //$timeout.cancel(this.renewTimeout);
                    //let hadError = false;
                    //let hadLocks = false;
                    try {
                        delete globalAutoRenewMap[instanceId]

                        if (this.locks.length === 0) {
                            return;
                        }
                        counter.increase();
                        //hadLocks = true;
                        await socket.actionEvent({
                            event: 'ngivr-lock-request',
                            action: 'unlock',
                            locks: this.locks,
                            id: socket.ioClient.lockId,
                            emit: emitAndUpdateScope,
                            userId: userId,
                            instanceId: instanceId,
                        })
                    } catch (e) {
                        if (typeof onError === 'function') {
                            onError({
                                doc: doc,
                                error: e,
                            })
                        }
                        ngivrException.handler(e);
                        throw e;
                    } finally {
                        if (this.locks.length > 0) {
                            if (typeof onUnlock === 'function') {
                                onUnlock({
                                    doc: doc,
                                });
                            }
                            counter.decrease();
                            if (emitAndUpdateScope) {
                                this.updateScope();

                            }
                            this.locks = [];
                        }
                    }
                }
            }
        } catch (e) {
            ngivrException.handler(e);
            throw e;
        }

    }

    factory.counter = counter;

    return factory;
});
