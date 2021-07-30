ngivr.angular.factory('ngivrOtherDocumentTemplateForm', function ($mdDialog, ngivrException, ngivrService, ngivrOtherDocumentTemplateFormField, ngivrLock, $rootScope, ngivrFormHelper, $mdDialog) {


    return new function () {

        const self = this;


        this.show = async (options) => {

            try {
                const dialogResult = await $mdDialog.show({
                    templateUrl: 'app/master/other-document/ngivr-other-document-template-form.html',
                    parent: angular.element(document.body),
                    targetEvent: options.$event,
                    //  fullscreen: true, // Only for -xs, -sm breakpoints.
                    controller: function ($scope,) {

                        let popupInpopup = false

                        // the $scope.model should exist
                        const dialogHelper = new ngivrFormHelper({
                            $scope: $scope,
                            dialogOptions: options,
                            schema: 'otherDocumentTemplate',
                            onNewModel: () => {
                                $scope.model = {
                                    id: undefined,
                                    label: undefined,
                                    fields: []
                                }
                            },
                            formName: 'ngivrOtherDocumentTemplateForm',
                            onAutoUnlockOrError: () => {
                                if (popupInpopup) {
                                    $mdDialog.cancel()
                                }
                            }
                        })



                        $scope.clickAddNewFieldOrEdit = async(options) => {

                            try {
                                popupInpopup = true
                                const responseDialog = await ngivrOtherDocumentTemplateFormField.show({
                                    dialogId: $scope.dialogId,
                                    $event: options.$event,
                                    type: 'new',
                                })
                                $scope.model.fields.push(responseDialog)

                            } catch(e) {
                                ngivrException.handler(e)
                            } finally {
                                popupInpopup = false
                            }
                        }

                        $scope.editField = async(field) => {
                            try {
                                popupInpopup = true
                                const responseDialog = await ngivrOtherDocumentTemplateFormField.show({
                                    dialogId: $scope.dialogId,
                                    $event: options.$event,
                                    type: 'edit',
                                    model: field,
                                })

                            } catch(e) {
                                ngivrException.handler(e)
                            } finally {
                                popupInpopup = false
                            }
                        }

                        $scope.deleteField = async(field) => {
                            try {
                                // question, growl, cancelCB, answers, multiple, options = {}
                                await ngivrService.confirm(ngivrService.strings.otherDocuments.confirm.deleteTemplateField)
                                const findFieldIndex = $scope.model.fields.indexOf(field)
                                if (findFieldIndex > -1) {
                                    $scope.model.fields.splice(findFieldIndex, 1)
                                }
                            } catch(e) {
                                ngivrException.handler(e)
                            }
                        }


                   },
                })

            } catch (e) {
                ngivrException.handler(e)
            }

        }
    }

})
