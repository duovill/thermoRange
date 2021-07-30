'use strict';
ngivr.angular.directive('ngivrForm', (ngivrService, socket /* //lock-old ,ngivrSocketLock //lock-old */, $timeout, Auth, ngivrLock, ngivrGrowl) => {

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            ngivrSchema: '@',
            ngModel: '=',
            ngivrId: '<',
            customSaveButtons: '=?',
            ngivrClose: '&?',
            ngivrLockOnUnlock: '&?',
            ngivrFormPinned: '<', //ha ez be van állítva, megjelenik az "új" gomb a formon
            newButtonCaption: '<?', //ha van új gomb, ez lesz a caption; default= ngivr.strings.button.new
            ngivrFormNoQuit: '<?', //ha ez be van állítva, nincs 'Kilépés' gomb
            quitOnUnLock: '<?' // ha true, unlocknál kilép a formból
        },
        transclude: {
            'body': 'ngivrFormBody',
        },
        templateUrl: 'components/directive/form/ngivr-form.html',

        controller: function ($scope, $timeout) {



//            console.log($scope.ngivrLockOnUnlock);

            const self = this;

            // <editor-fold desc="Constructor">

            const thisFormIndex = ngivr.nextId();

            const generateCurrentResource = () => {
                return `${$scope.ngivrSchema}:` + $scope.ngModel._id;
            }

            /**
             * Ha popupban van megnyitva a form,
             * akkor a popup komponens értesítést kap,
             * és kilépéskor megerősítést kér, ha módosult
             * az adat
             */
            $scope.$watch('originalSame', (newVal, oldVal) => {
                if (newVal !== oldVal) {
                    $scope.publish('originalSameChanged', newVal)
                }
            });
            // </editor-fold>

            // <editor-fold desc="LIFECYCLE">
            this.lifeCycleType = {
                load: 'ngivrFormLoad',
                save: 'ngivrFormSave',
            }

            this.lifecycle = (cycleName, method, options) => {

                const name = _.capitalize(method);
                let log = `${_.kebabCase(cycleName).toUpperCase()} LIFECYCLE: ${name}`;
                let result;
                if ($scope.$parent.hasOwnProperty(cycleName) &&
                    $scope.$parent[cycleName].hasOwnProperty(method) &&
                    (
                        typeof($scope.$parent[cycleName][method]) === 'function'
                    )
                ) {
                    result = $scope.$parent[cycleName][method](options);
                    if (result instanceof Promise) {
                        log += ` - PROMISE`;
                    }
                    else if (result instanceof Function && result[Symbol.toStringTag] === 'AsyncFunction') {
                        log += ` - ASYNC FUNCTION`;
                    } else {
                        log += ` - FUNCTION`;
                        result = new Promise((resolve) => resolve(result));
                    }
                } else {
                    log += ' - DISABLED';
                    result = Promise.resolve(true);
                }
                ngivr.console.log(log);
                return result;
            }
            // </editor-fold>

            // <editor-fold desc="UTILS">
            const formLog = `FormId:${thisFormIndex}`;

            this.destroyLoaded = () => {
                if (this.loaded !== undefined) {
                    this.loaded.destroy();
                    this.loaded = undefined;
                }
            }

            this.undo = () => {
                $scope.ngModel = angular.copy($scope.original);
            }

            this.keepOriginal = () => {
                $scope.original = angular.copy($scope.ngModel);
            }


            // </editor-fold>

            // <editor-fold desc="CLONE">
            this.clone = async () => {

                try {
                    await service.confirm(ngivr.strings.question.clone, ngivr.strings.message.clone, undefined,
                        undefined,
                        true,
                        {
                            existingDialog: formName,
                        })
                    await ngivrLockInstance.clear();
                    ngivr.mongoose.clean($scope.ngModel);
                    $scope.saveble = true;
                    $scope.original = {};
                    this.setEnabled(true);
                    this.destroyLoaded();
                } catch (e) {
                    ngivr.growl.error(e)
                }
            }
            // </editor-fold>

            // <editor-fold desc="QUIT">
            this.quit = async (forceQuit = false) => {

                if ($scope.ngivrClose === undefined) {
                    ngivr.growl('ngivr-close nincs benne a formban, nem mukodik a bezar gomb, csinaljuk ugy, ha nincs benne, akkor nem mutatja a gombot is?');
                    return;
                }

                try {
                    if (!$scope.originalSame && forceQuit === false) {
                        await service.confirm(
                            ngivr.strings.question.modelNotSame,
                            ngivr.strings.message.close,
                            undefined,
                            undefined,
                            true,
                            {
                                existingDialog: formName,
                            }
                        );
                        $scope.ngModel = angular.copy($scope.original);
                    }

                    $timeout(() =>  {
                        $scope.ngivrClose();
                    }, ngivr.settings.debounce)

                } catch (e) {
                    ngivr.growl.error(e)
                }
            }
            // </editor-fold>


            // <editor-fold desc="CLOSE">

            this.close = async (force = false) => {
                try {
                    if (force === false && !$scope.originalSame) {
                        await service.confirm(ngivr.strings.question.modelNotSame, undefined, undefined,
                            undefined,
                            true,
                            {
                                existingDialog: formName,
                            });
                        $scope.ngModel = angular.copy($scope.original)
                    }
                    this.setEnabled(false);
                    await ngivrLockInstance.unlock()
                } catch (e) {
                    ngivr.growl.error(e)
                }
            }

            // </editor-fold>

            // <editor-fold desc="LOAD">

            this.load = async () => {

                try {
                    ngivr.console.group(`NGIVR-FORM:load: ${$scope.ngivrSchema} ${formLog}`);

                    this.destroyLoaded();

                    let result;

                    result = await this.lifecycle(this.lifeCycleType.load, 'before')
                    if (result === 'stop') {
                        return;
                    }
                    if (result === false) {
                        ngivr.growl(ngivr.strings.message.error.load);
                        return;
                    }
                    this.loaded = service.data.id({
                        schema: $scope.ngivrSchema,
                        id: $scope.ngivrId,
                        $scope: $scope
                    });
                    const response = await this.loaded.promise;
                    //console.log(response.data);
                    ngivr.json.assign($scope.ngModel, response.data.doc);

                    this.keepOriginal();
                    this.setEnabled(false);
                    ngivr.growl(ngivr.strings.message.success.load);
                    ngivr.event.broadcast($scope, ngivr.settings.event.client.form.loaded, this);
                    result = await this.lifecycle(this.lifeCycleType.load, 'after');

                    if (result === false || result === 'stop') {
                        throw new Error(ngivr.strings.message.error.load);
                    }
                    ngivrLockInstance.addResource({
                        resource: generateCurrentResource()
                    })
                } catch (e) {

                    ngivr.growl(ngivr.strings.message.error.load);
                    ngivr.console.error(e);

                    try {
                        await this.lifecycle(this.lifeCycleType.load, 'error');
                    } catch (e) {
                        ngivr.growl.error(e)
                    }
                } finally {
                    ngivr.console.group();

                }
            }

            // </editor-fold>

            // <editor-fold desc="EDIT">
            this.edit = async () => {
                try {
                    await ngivrLockInstance.lock();
                    this.setEnabled(true)
                } catch (err) {
                    ngivrGrowl('A form zárolva van, jelenleg nem szerkeszthető!');
                }

            }
            // </editor-fold>

            // <editor-fold desc="SAVE">

            $scope.processing = false
            this.save = async (options) => {

                let result;
                $scope.processing = true
                try {
                    ngivr.console.group(`NGIVR-FORM save: ${$scope.ngivrSchema} ${formLog}`);

                    result = await this.lifecycle(this.lifeCycleType.save, 'validate');
                    if (result === false || result === 'stop') {
                        ngivr.growl(ngivr.strings.form.error.default, 'error');
                        return;
                    }
                    result = service.form.validate($scope[formName]);

                    if (result === false) {
                        // form validacio mar hasznalja a growlt. ugyhogy nem kell
                        //ngivr.growl.error(ngivr.strings.form.error.default);
                        return;
                    }
                    result = await this.lifecycle(this.lifeCycleType.save, 'before', options);
                    if (result === false || result === 'stop') {
                        ngivr.growl.error(ngivr.strings.message.error.save);
                        return;
                    }
                    if (result === 'cancelSave') return;

                    const response = await service.api.save($scope.ngivrSchema, $scope.ngModel);

                    if (this.loaded === undefined) {
                        this.loaded = service.data.id({
                            schema: $scope.ngivrSchema,
                            id: $scope.ngivrId,
                            $scope: $scope,
                            preloaded: response
                        });
                    }

                    if (response.data.doc === undefined && response.data.hasOwnProperty('_id')) { //birtokátruházó mentésekor a response a ticket.calcs-ból jön, ilyenkor nincs data.doc
                        Object.assign($scope.ngModel, response.data);
                    } else {
                        Object.assign($scope.ngModel, response.data.doc);
                    }

                    this.keepOriginal();

                    ngivr.growl(ngivr.strings.message.success.save);


                    ngivrLockInstance.addResource({
                        resource: generateCurrentResource()
                    })


                    //if ($scope.ngivrFormPinned)  this.clear();

                    result = await this.lifecycle(this.lifeCycleType.save, 'after');

                    if (result !== 'stop') {
                        await this.close()
                    }

                } catch (e) {
                    ngivr.growl.error(ngivr.strings.message.error.save);
                    ngivr.console.error(e);

                    try {
                        await this.lifecycle(this.lifeCycleType.save, 'error');
                    } catch (e) {
                        ngivr.growl.error(e)
                    }
                } finally {
                    ngivr.console.group();

                    $scope.processing = false;
                    $scope.$apply()

                }
            }
            // </editor-fold>

            // <editor-fold desc="CLEAR">
            //törli a formot (a modellt alapértelmezettre állítja!)

            // ebben biztos nincs LOCK!!!!!
            this.clear = async (forceQuit = false) => {
                try {
                    if (!$scope.originalSame && (forceQuit === false || $scope.enabled)) {
                        await service.confirm(
                            ngivr.strings.question.modelNotSame,
                            ngivr.strings.message.close, undefined,
                            undefined,
                            true,
                            {
                                existingDialog: formName,
                            }
                        );
                        $timeout(() => $scope.$apply());
                    }
                    $scope.ngModel = $scope.ngivrSchema ? new ngivr.model[$scope.ngivrSchema]($scope.$parent.modelOptions) : {};
                    this.keepOriginal(); //saves emtpy model as original
                    if (!$scope.ngivrFormPinned) {
                        await this.edit();
                    } else {
                        this.setEnabled(true)
                    }


                    //TODO could be have to use $apply (inheritance) - top up as well below

                    service.form.clear($scope[$scope.formName]);

                } catch (e) {
                    ngivr.growl.error(e)
                }

            }
            // </editor-fold>

            // <editor-fold desc="SOCKET SYNCH">

            /**
             * SOCKET SYNCH
             * @type {{socket: (*)}}
             */
            const events = {
                socket: socket.getEvents($scope.ngivrSchema)
            };
            const listeners = {
                remove: (data) => {
                    if ($scope.ngModel.hasOwnProperty('_id') && data._id === $scope.ngModel._id) {
                        ngivr.growl.error(ngivr.strings.message.removedFromForm);
                        this.quit(true)
                    }
                }
            }
            socket.ioClient.on(events.socket.remove, listeners.remove);

            // </editor-fold>

            // <editor-fold desc="ENABLED">

            this.setEnabled = (flag) => {
                $scope.enabled = flag;
            }

            $scope.$watch('enabled', (value, oldValue) => {
                ngivr.event.broadcast($scope, ngivr.settings.event.client.form.enabled, value);
            });
            $scope.enabled = !$scope.ngModel.hasOwnProperty('_id');

            // </editor-fold>

            // <editor-fold desc="ORIGINALSAME">
            /**
             * ORIGINALSAME
             */
            Object.defineProperty($scope, 'originalSame', {
                //set: (value) = stb..
                get: () => {
                    const model = angular.toJson($scope.ngModel);
                    const original = angular.toJson($scope.original);
                    const test = model === original;

                    /*
                    console.log(test ? 'egyforme' : 'mas');
                    if (!test) {
                      console.log('******************************');
                      console.log('******************************');
                      console.log(model);
                      console.log('******************************');
                      console.log('******************************');
                      console.log(original);
                      console.log('******************************');
                    }
                    */
                    return test;
                }
            });

            // </editor-fold>

            // <editor-fold desc="Initialization">
            const service = ngivrService;

            $scope.ngivr = ngivrService;

            $scope.saveble = true;

            const formName = `ngivrForm${thisFormIndex}`;

            // ez a load/betoltes elott kell mar
            const ngivrLockInstance = ngivrLock({
                // undefined, string or array of object ( [ { resource: resosurceId } ]
                resource: undefined,
                scope: $scope,
                onUnlock: () => {
                    if ($scope.ngivrLockOnUnlock !== undefined) {
                        $scope.ngivrLockOnUnlock();
                    }
                },
                onAutoUnlockOrError: (options) => {
                    const {error} = options;
                    if (error) {
                        service.exception.handler(error);
                    }
                    $scope.ngModel = angular.copy($scope.original);
                    this.setEnabled(false);
                },
            })
            $scope.lock = ngivrLockInstance;

            if ($scope.ngivrId !== undefined) {
                this.load();
            } else {
                this.keepOriginal()
            }

            $scope.formName = formName;
            $scope.command = self;

            // </editor-fold>

            // <editor-fold desc="destroy">


            $scope.$on('$destroy', async () => {
                try {
                    ngivr.console.group(`NGIVR-FORM: destroyed ${formLog}`)
                    ngivr.console.log('SOCKET synch')
                    socket.ioClient.removeListener(events.socket.remove, listeners.remove);
                    ngivr.console.group()
                } catch (e) {
                    service.exception.handler(e);
                }
            });

            // </editor-fold>

        }
    }
});
