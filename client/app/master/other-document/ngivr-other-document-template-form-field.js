ngivr.angular.factory('ngivrOtherDocumentTemplateFormField', function ($mdDialog, ngivrException, ngivrService, $timeout) {


    return new function () {

        const self = this;

        this.show = async (options) => {

            return $mdDialog.show({
                templateUrl: 'app/master/other-document/ngivr-other-document-template-form-field.html',
                parent: angular.element(document.body),
                targetEvent: options.$event,
                multiple: true,
                //  fullscreen: true, // Only for -xs, -sm breakpoints.
                controller: function ($scope, $rootScope) {

                    $scope.options = options;

                    let originalOption
                    if (options.hasOwnProperty('model')) {
                        $scope.model = options.model
                        if ($scope.model.hasOwnProperty('metadata') && $scope.model.metadata.hasOwnProperty('option')) {
                            originalOption = angular.copy($scope.model.metadata.option)
                        }
                    } else {
                        $scope.model = {
                            type: undefined,
                            validations: [],
                            displayInList: true,
                            metadata: {
                                schema: undefined,
                                option: [],
                            },
                            label: undefined
                        }
                    }
                    //console.warn($scope.model)

                    $scope.$watch('model.metadata.schema', (value, oldValue) => {
                        //console.warn('model.metadata.schema', value, $scope.model.type)
                        if ($scope.model.type === 'related') {
                            $scope.model.label = 'Kapcsoló ' + $rootScope.ngivr.strings.schema[value]
                        }
                    })

                    $scope.$watch('model.label', (value, oldValue) => {
                        //console.warn('watch.model.label')
                        $scope.model.id = _.kebabCase(value)
                    })

                    $scope.$watch('model.type', (value, oldValue) => {
                        const createOptions = () => {
                            switch (value) {
                                case 'select':
                                    if (originalOption !== undefined) {
                                        $scope.model.metadata.option = originalOption;
                                        originalOption = undefined
                                    } else {
                                        $scope.model.metadata.option = [
                                            {
                                                label: '',
                                            }
                                        ]
                                    }
                                    break;
                            }
                        }
                        if (oldValue !== value && value === 'related') {
                            if (typeof $scope.model.id  !== undefined) {
                                $scope.model.id = 'related'
                            }
                            $scope.model.metadata.scheme = undefined

                        }
                        createOptions()
                        if (oldValue === undefined || value === oldValue) {
                            return;
                        }
                        //console.warn(`$scope.$watch('type'`, value, oldValue, $scope.model.metadata)
                        $scope.model.metadata = {}
                        createOptions()
                    })

                    $scope.validationExists = (validation) => {
                        let find = $scope.model.validations.find(validationExisting => validationExisting.name === validation.name)
                        /*
                        if (validation.required === true) {
                            return true;
                        }
                        */
                        return find !== undefined
                    }

                    $scope.validationToggle = (validation) => {
                        const findIndex = $scope.model.validations.findIndex(validationExisting => {
                            return validationExisting.name === validation.name
                        })
                        if (findIndex === -1) {
                            $scope.model.validations.push(validation)
                        } else {
                            $scope.model.validations.splice(findIndex, 1)
                        }

                    }

                    /*
                    $scope.validations = Object.keys(ngivrService.strings.otherDocuments.validations).map(validation => {
                        return {
                            name: validation,
                            type: validation.split('-')[0]
                        }
                    })

                    console.warn('$scope.validations', $scope.validations, ngivr.settings.otherDocuments.validations)
                    */

                    $scope.validations = ngivr.settings.otherDocuments.validations

                    // Promise reject
                    $scope.cancel = function () {
                        // could use growl/toast
                        $mdDialog.cancel();
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

                    $scope.selectAddOption = (opts) => {
                        const { $index } = opts
                        $scope.model.metadata.option.push({
                            label: ''
                        })
                    }

                    $scope.selectRemoveOption = (opts) => {
                        const { $index } = opts
                        $scope.model.metadata.option.splice($index, 1)
                    }

                    $scope.submit = () => {
                        if (!$rootScope.ngivr.form.validate($scope.ngivrOtherDocumentTemplateFieldForm)) {
                            return;
                        }
                        try {
                            // validate validations in the model
                            //console.warn('$scope.model.validations before ', $scope.model.validations)
                            $scope.model.validations = $scope.model.validations.filter(f => f.type === 'all' || f.type === $scope.model.type)
                            //console.warn('$scope.model.validations after ', $scope.model.validations)

                            /*
                            const addRequiredValidations = []

                            $scope.validations.forEach(validation => {
                                //console.warn('$scope.validations.forEach(validation ', validation)
                                if (validation.required === true && validation.type === $scope.model.type) {
                                    let foundRequired = false
                                    //console.warn('for(let modelValidation in $scope.model.validations) ', $scope.model.validations, validation.name)
                                    for (let modelValidation of $scope.model.validations) {
                                        if (modelValidation.name === validation.name) {
                                            foundRequired = true
                                            break;
                                        }
                                    }
                                    //console.warn('if (!foundRequired) { ', foundRequired)
                                    if (!foundRequired) {
                                        addRequiredValidations.push(validation)
                                    }
                                }
                            })
                            $scope.model.validations = $scope.model.validations.concat(addRequiredValidations)
                            */
                            //console.warn($scope.model)
                            $mdDialog.hide(angular.copy($scope.model));

                        } catch (e) {
                            ngivrException.handler(e)
                        } finally {

                        }
                    }


                },
            })
        }


    }

})
