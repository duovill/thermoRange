ngivr.angular.factory('ngivrFormHelper', function ($mdDialog, ngivrException, ngivrService, ngivrLock, $rootScope, ngivrForm) {

    /**
    used events:
     onLoaded
     onNewModel
     onModelLoaded
     onSubscribed
     onAutoUnlockOrError
     onCancel
     onBeforeSave
     onSaved
    **/

    return function (options) {
        const self = this;
        const selfOptions = options
        const {$scope, schema, dialogOptions} = options
        $scope.options = dialogOptions;
        $scope.dialogId = ngivr.nextId()

        this.createResource = () => {
            return `${schema}:${$scope.model._id}`
        }

        this.ngivrLockInstance = undefined;

        if (options.hasOwnProperty('onLoaded')) {
            options.onLoaded();
        }

        this.subscribe = () => {
            ngivrService.data.id({
                schema: schema,
                model: $scope.model,
                $scope: $scope,
                subscribe: async (promise) => {
                    try {
                        const response = await promise;
                        //console.warn('response before', typeof response, response)
                        //console.warn('model before', typeof $scope.model, $scope.model)
                        ngivr.json.assign($scope.model, response)
                        if (options.hasOwnProperty('onSubscribed')) {
                            await options.onSubscribed()
                        }
                        //console.warn('model after', $scope.model)
                    } catch (e) {
                        ngivrService.exception.handler(e)
                    }

                }
            });
        }

        this.editable = false;

        if (dialogOptions.type === 'new') {
            this.editable = true;
            options.onNewModel()
        } else {
            $scope.model = angular.copy(dialogOptions.model)
            if (options.hasOwnProperty('onModelLoaded')) {
                options.onModelLoaded();
            }
            this.subscribe()
        }

        const originalModel = angular.copy($scope.model)


        this.ngivrLockInstance = ngivrLock({
            resource: $scope.model.hasOwnProperty('_id') ? this.createResource() : undefined,
            scope: $scope,
            onAutoUnlockOrError: (options) => {
                const {error} = options;
                if (error) {
                    ngivrService.exception.handler(error);
                }
                this.editable = false;
                //console.warn(selfOptions.hasOwnProperty('onAutoUnlockOrError'), selfOptions.onAutoUnlockOrError, selfOptions)
                if (selfOptions.hasOwnProperty('onAutoUnlockOrError')) {
                    selfOptions.onAutoUnlockOrError();
                }
            },
        })
        $scope.lock = this.ngivrLockInstance;


        // Promise reject
        $scope.cancel = async function (options = {}) {
            let { force } = options
            if (force === undefined) {
                force = false;
            }
            // could use growl/toast
            if ($scope.enabled && dialogOptions.type !== 'new' && force === false) {
                try {
                    self.editable = false

                    $scope.model = angular.copy(originalModel)

                    if (selfOptions.hasOwnProperty('onCancel')) {

                        await selfOptions.onCancel();
                    }
                    await self.ngivrLockInstance.unlock()
                } catch (e) {
                    ngivrService.exception.handler(e)
                }
            } else {
                $mdDialog.cancel();
            }
        };

        /*
          // Promise resolve
          $scope.hide = function () {
              $mdDialog.hide();
          };

          // Promise resolve - with result
          $scope.answer = function (answer) {
              $mdDialog.hide(answer);
          };
          */

        Object.defineProperty($scope, 'disabled', {
            get: () => {
                if ($scope.lock === undefined && dialogOptions.type !== 'new') {
                    return true;
                }
                return !this.editable;
            }
        })

        Object.defineProperty($scope, 'enabled', {
            get: () => {
                return !$scope.disabled;
            }
        })


        Object.defineProperty($scope, 'editable', {
            get: () => {
                return $scope.enabled;
            }
        })

        $scope.edit = async () => {
            try {
                await this.ngivrLockInstance.lock()
                this.editable = true
            } catch (e) {
                this.editable = false
                ngivrService.exception.handler(e)
            }
        }

        $scope.submit = async () => {
            if (!$rootScope.ngivr.form.validate($scope[options.formName])) {
                return;
            }
            try {
                if (options.hasOwnProperty('onBeforeSaved')) {
                    await options.onBeforeSaved()
                }
                const response = await ngivrService.api.save(schema, $scope.model);
                ngivr.json.assign($scope.model, response.data.doc);

                if (dialogOptions.type === 'new') {
                    this.ngivrLockInstance.addResource({
                        resource: this.createResource()
                    })
                    dialogOptions.type = 'edit';
                    this.subscribe()
                } else {
                    await this.ngivrLockInstance.unlock()
                }
                if (options.hasOwnProperty('onSaved')) {
                    await options.onSaved()
                }
                this.editable = false;
            } catch (e) {
                if (!ngivrForm.error($scope[options.formName], e)) {
                    ngivrException.handler(e)
                }
            }
        }


    }

})
