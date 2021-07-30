ngivr.angular.factory('ngivrOtherDocumentForm', function($mdDialog, ngivrException, ngivrService, ngivrLock, $rootScope, ngivrFormHelper, Auth) {


    return new function() {

        this.show = async (options) => {
                // preloadedTemplate
            try {
                const dialogResult = await $mdDialog.show({
                    templateUrl: 'components/ui/popup/other-document/ngivr-other-document-form.html',
                    parent: angular.element(document.body),
                    targetEvent: options.$event,
                    clickOutsideToClose: true,
                    //  fullscreen: true, // Only for -xs, -sm breakpoints.
                    controller: function ($scope) {

                        // the $scope.model should exist
                        const dialogHelper = new ngivrFormHelper({
                            $scope: $scope,
                            dialogOptions: options,
                            schema: 'otherDocument',
                            onLoaded: () => {
                                $scope.helperModel = {
                                    templateType: undefined
                                }
                            },
                            onNewModel: () => {
                                $scope.model = {
                                    templateType: options.preloadedTemplate,
                                    fieldsAndsValues: {},
                                    createdBy: {
                                        fullName: Auth.getCurrentUser().fullName,
                                        id: Auth.getCurrentUserId()
                                    }
                                }
                                $scope.helperModel = {
                                    templateType: options.preloadedTemplate
                                }
                            },
                            onModelLoaded: () => {
                                $scope.helperModel.templateType = $scope.model.templateType
                            },
                            onSubscribed: async () => {
                                const response = await ngivrService.api.id('otherDocumentTemplate', $scope.model.templateType)
                                $scope.helperModel.templateType = response.data.doc
                            },
                            onSaved: () => {
                                $scope.model.templateType = $scope.helperModel.templateType._id;
                            },
                            onCancel: () => {
                                $scope.helperModel.templateType = $scope.model.templateType

                            },
                            onBeforeSaved: () => {
                                if (typeof $scope.model.templateType === 'object') {
                                    $scope.helperModel.templateType = $scope.model.templateType
                                    $scope.model.templateType = $scope.model.templateType._id;
                                }
                                const savedFields = {}
                                $scope.helperModel.templateType.fields.forEach(field => {
                                    savedFields[field.id] = $scope.model.fieldsAndsValues[field.id]
                                })
                                $scope.model.fieldsAndsValues = savedFields

                                $scope.model.searchValues = Object.keys($scope.model.fieldsAndsValues).map(field => {
                                   // console.warn('searchValues', field, typeof $scope.model.fieldsAndsValues[field])
                                    if ($scope.model.fieldsAndsValues[field] !== undefined && $scope.model.fieldsAndsValues[field].hasOwnProperty('name')) {
                                        return $scope.model.fieldsAndsValues[field].name
                                    } else {
                                        return $scope.model.fieldsAndsValues[field]
                                    }
                                })
                                //console.warn('onBeforeSaved', $scope.model)
                            },
                            formName: 'ngivrOtherDocumentForm',
                        })


                        $scope.$watch('helperModel.templateType', (newVal, oldVal) => {
                            if (newVal === undefined || newVal === null) {
                                $scope.model.templateType = undefined
                            } else {
                                $scope.model.templateType = newVal._id
                            }
                        })


                        /*
                        $scope.$watch('model.templateType', (newVal, oldVal) => {
                            if (newVal !== oldVal) {
                                $scope.model.fieldsAndsValues = {}
                            }
                        })
                        */

                        $scope.hasValidation = (opts) => {
                            const { field, name } = opts;
                            let foundValidation = false;
                            for(let validation of field.validations) {
                                if (validation.name === name) {
                                    foundValidation = true;
                                    break
                                }
                            }
                            return foundValidation;
                        }

                        let currentRelatedAutocomplateField

                        $scope.getRelated = async (field, searchText ) => {
                            //console.warn('getRelated', field, searchText)
                            try {

                                const response = await ngivrService.api.query(field.metadata.schema, {
                                    limit: 50,
                                    search: {
                                        'name': {
                                            '$regex': searchText,
                                            '$options': 'i'
                                        }
                                    },
                                    sort: {
                                        name: 1
                                    }
                                })

                                return response.data.docs;
                            } catch(e) {
                                ngivrException.handler(e)
                                return [];
                            }
                        }

                        $scope.getRelatedSearchTextChange = function(item, field) {
                            console.warn('getRelatedTest', arguments)
                            currentRelatedAutocomplateField = field
                            $scope.model.fieldsAndsValues[currentRelatedAutocomplateField.id] = {
                                _id: undefined,
                                name: undefined,
                            }
                        }

                        $scope.getRelatedSelectedItemChange = function(item) {
                            console.warn('getRelatedSelectedItemChange item', item)
                            console.warn('getRelatedSelectedItemChange model', $scope.model)
                            console.warn('getRelatedSelectedItemChange currentRelatedAutocomplateField', currentRelatedAutocomplateField)
                            if (item === undefined) {
                                $scope.model.fieldsAndsValues[currentRelatedAutocomplateField.id] = {
                                    _id: undefined,
                                    name: undefined,
                                }
                                return;
                            }
                            $scope.model.fieldsAndsValues[currentRelatedAutocomplateField.id] = {
                                _id: item._id,
                                name: item.name,
                            }
                        }

                    },
                })

            } catch(e) {
                ngivrException.handler(e)
            }

        }
    }

})
