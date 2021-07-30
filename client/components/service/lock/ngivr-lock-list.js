ngivr.angular.factory('ngivrLockList', (ngivrException, ngivrLockService, ngivrLock, $timeout) => {

    const consolePrefix = 'NGIVR-LOCK-LIST:';

    const factory = (options) => {

        return new function () {
            let editing = false;
            let lastEditing = false;
            this.type = 'list';

            const {scope, watchCollection, schema, watchEditing, watch, list, debug} = options;

            let {onAutoUnlockOrError, onUnlock, listKeepLockonUpdate} = options;

            if (debug) {
                window.ngivrLockList = window.ngivrLockList || {}
                window.ngivrLockList[watch || watchCollection] = this;
            }

            let {docIdName} = options;

            if (docIdName === undefined) {
                docIdName = '_id';
            }

            if (listKeepLockonUpdate === undefined) {
                listKeepLockonUpdate = false;
            }


            this.lockMap = {};

            let docCount = 0;
            let onAutoUnlockOrErrorList;

            const destroy = async () => {
                for (let lock of Object.values(this.lockMap)) {
                    try {
                        await lock.destroy()
                        lock.locks = [];
                    } catch (e) {
                        ngivrException.handler(e)
                    }
                }
                docCount = 0;
                this.lockMap = {};
                ngivrLockService.emitLocks()
            }

            if (list === true) {
//                //// FIXME lista unlock

                window.ngivrLockList = window.ngivrLockList || {
                    watch: {},
                    watchCollection: {},
                };
                if (watch !== undefined) {
                    window.ngivrLockList.watch[watch] = this;
                } else {
                    window.ngivrLockList.watchCollection[watchCollection] = this;
                }

//                ngivr.growl.warning(`ngivr-lock-list is a list ${schema}`)
                let loadingListTimeout;
                const loadingList = () => {
                    loadingListTimeout = $timeout(() => {
                        if (scope.ngivrListOn === undefined) {
                            $timeout.cancel(loadingListTimeout)
                            loadingList();
                            return;
                        }
                        scope.ngivrListOn.update = () => {
                            //ngivr.growl.warning(`ngivr-lock-list is a list ${schema} ngivrListOn.update `)
                            if (listKeepLockonUpdate) {
                                //ngivr.growl.warning('ngivr-lock-list ngivrListOn.update runRound')
                                runRound(watch === undefined ? 'watchCollection' : 'watch')
                            } else {
                                //ngivr.growl.warning('ngivr-lock-list ngivrListOn.update unlock')
                                this.unlock();
                            }
                        };
                    })
                }
                loadingList()


                onAutoUnlockOrErrorList = async (options) => {
                    try {
//                        ngivrLock.counter.increase();
//                        alert('increase')
//                        if (ngivrLock.counter.count === docCount) {
//                            alert('done')
                        scope.ngivrListCommand.refresh({
                            done: async () => {
                                try {
                                    if (onAutoUnlockOrError !== undefined) {
                                        await onAutoUnlockOrError(options)
                                    }
//                                        ngivrLock.counter.subtract(docCount);
                                    await destroy();
                                } catch (e) {
                                    ngivrException.handler(e);
                                } finally {
                                    docCount = 0;
                                }
                            }
                        })
//                        }
                    } catch (e) {
                        ngivrException.handler(e);
                    }
                }
            }

            const runRound = async (type) => {
                let docs = _.get(scope, watch || watchCollection);
                console.log(consolePrefix, 'runRound', watch || watchCollection, type, 'editing', editing)

                if (!Array.isArray(docs)) {
                    docs = [];
                }


                const checkLocks = {};
                for (let doc of docs) {
                    if (doc.hasOwnProperty(docIdName)) {
                        const docId = doc[docIdName]
                        const resource = ngivrLockService.generateSimpleResource(schema, docId)
                        checkLocks[docId] = true;
                        if (!this.lockMap.hasOwnProperty(docId)) {
                            //console.log(`${consolePrefix}`, resource)
                            this.lockMap[docId] = ngivrLock({
                                doc: doc,
                                scope: scope,
                                modelId: docId,
                                resource: resource,
                                emitAndUpdateScope: false,
                                useDestroy: false,
                                onUnlock: onUnlock,
                                onAutoUnlockOrError: onAutoUnlockOrErrorList,
                            })
                        }
                    }
                }

                for (let existingLockId of Object.keys(this.lockMap)) {
                    if (!checkLocks.hasOwnProperty(existingLockId)) {
                        const lock = this.lockMap[existingLockId];
                        try {
                            await lock.destroy();
                        } catch (e) {
                            ngivrException.handler(e)
                        } finally {
                            delete this.lockMap[existingLockId];
                        }
                    }
                }

                if (watchEditing !== undefined) {
                    for (let currentLock of Object.values(this.lockMap)) {
                        try {
                            console.log(`${consolePrefix} ${editing ? 'lock' : 'unlock'}`, currentLock.resource[0].resource)
                            if (editing) {
                                console.log(consolePrefix, currentLock.locks);
                                await currentLock.lock({
                                    extend: currentLock.locks.length > 0
                                })
                            } else {
                                await currentLock.unlock()
                            }
                        } catch (e) {
                            ngivrException.handler(e)
                        }
                    }
                }

                // todo optimize
                ngivrLockService.emitLocks();
            }

            scope.$on('$destroy', async () => {
                try {
                    await destroy()
                } catch (e) {
                    ngivrException.handler(e);
                }
            })


            if (watchEditing !== undefined) {
                scope.$watch(watchEditing, (newvalue, oldvalue) => {
                    console.log(consolePrefix, 'editing', newvalue)
                    editing = newvalue === undefined ? false : newvalue
                    if (lastEditing !== editing) {
                        lastEditing = editing;
                        runRound('editing');
                    }
                })
            }

            if (watchCollection !== undefined) {
                //let watchCollectionFirst = true
                scope.$watchCollection(watchCollection, async (newvalue, oldvalue) => {
                    /*
                    if (!watchCollectionFirst && ngivr.json.equals(newvalue, oldvalue)) {
                        ngivr.growl(options.watchCollection)
                        return;
                    }
                    watchCollectionFirst = false;
                    ngivr.growl(`first: ${options.watchCollection}`)
                    */
                    runRound('watchCollection');
                })
            }

            if (watch !== undefined) {
                //let watchFirstWatch = true;
                scope.$watch(watch, async (newvalue, oldvalue) => {

                    /*
                    if (!watchFirstWatch && ngivr.json.equals(newvalue, oldvalue)) {
                        ngivr.growl(options.watch)
                        return;
                    }
                    watchFirstWatch = false;
                    ngivr.growl(`first: ${options.watch}`)
                    */
                    runRound('watch');
                })
            }

            this.lock = async () => {
                console.log(`${consolePrefix} lock`)
                for (let lock of Object.values(this.lockMap)) {
                    try {
                        await lock.lock();
                    } catch (e) {
                        ngivrException.handler(e)
                    }
                }
            }

            this.unlock = async () => {
                console.log(`${consolePrefix} lock`)
                for (let lock of Object.values(this.lockMap)) {
                    try {
                        docCount = 0;
                        await lock.unlock();
                        lock.locks = [];
                    } catch (e) {
                        ngivrException.handler(e)
                    }
                }
            }

            Object.defineProperty(this, 'locked', {
                get: () => {
                    for (let lock of Object.values(this.lockMap)) {
                        if (lock.locked) {
                            return true;
                        }
                    }
                    return false;
                }
            })

            Object.defineProperty(this, 'lockedCount', {
                get: () => {
                    let lockedCount = 0
                    for (let lock of Object.values(this.lockMap)) {
                        if (lock.locked) {
                            lockedCount++;
                        }
                    }
                    return lockedCount;
                }
            })


            Object.defineProperty(this, 'lockedNickname', {
                get: () => {
                    for (let lock of Object.values(this.lockMap)) {
                        if (lock.locked) {
                            return lock.lockedNickname;
                        }
                    }
                    return undefined;
                }
            })

            const verifyDocumentOptions = (options) => {
                const {doc} = options;
                if (doc === undefined || doc === null || !doc.hasOwnProperty(docIdName) || !this.lockMap.hasOwnProperty(doc[docIdName])) {
                    return false;
                }
                return true;
            }

            const getDocumentOptionsLock = (options) => {
                const {doc} = options;
                return this.lockMap[doc[docIdName]];
            }


            this.isDocumentLocked = (options) => {

                const verified = verifyDocumentOptions(options);
                //   console.warn('verified', verified, 'options', options)
                if (!verified) {
                    return false;
                }
                const locked = getDocumentOptionsLock(options).locked;
                //    console.warn('getDocumentOptionsLock(options).locked', locked)
                return locked
            }

            this.isDocumentLockedByMe = async (options) => {
                const verified = verifyDocumentOptions(options);
                if (!verified) {
                    return false;
                }
                const locked = getDocumentOptionsLock(options).locked;
                const find = `${schema}:${options.doc[docIdName]}`
//                console.warn('getDocumentOptionsLock(options).locked', locked, `find`, find)
                if (locked === false) {
                    const allLocks = await ngivrLockService.getAllLocks({
                        parsed: true,
                    })
//                    console.warn('allLocks', JSON.stringify(allLocks, null, 4))
                    for (let lock of allLocks.mine.locks) {
//                        console.warn(`lock`, allLocks)
                        if (lock.doc === find) {
                            console.warn('found locked by me')
                            return true;
                        }
                    }
                }
                return locked
            }

            this.lockDocument = async (options) => {
                docCount++
                await getDocumentOptionsLock(options).lock()
                ngivrLockService.emitLocks();
            }

            this.unlockDocument = async (options) => {
                docCount--
                /*
                debug({
                    name: 'unlockDocument',
                    opts: options,
                })
                */
                await getDocumentOptionsLock(options).unlock();
                ngivrLockService.emitLocks();
            }

            Object.defineProperty(this, 'docCount', {
                get: () => {
                    return docCount;
                }
            })

        }


    }

    return factory;
});

