ngivr.angular.factory('thermoMeasuringInstrumentForm', function ($mdDialog, ngivrException, ngivrService, ngivrLock, $rootScope, ngivrFormHelper, $mdDialog) {


    return new function () {

        const self = this;


        this.show = async (options) => {

            try {
                const dialogResult = await $mdDialog.show({
                    templateUrl: 'app/_thermo/measuring-instrument/thermo-measuring-instrument-form.html',
                    parent: angular.element(document.body),
                    targetEvent: options.$event,
                    //  fullscreen: true, // Only for -xs, -sm breakpoints.
                    controller: function ($scope,) {

                        $scope.macIdRegex = ngivr.settings.validation.macId.regex
                        $scope.urlRegex = ngivr.settings.validation.url.regex

                        let popupInpopup = false

                        // the $scope.model should exist
                        const dialogHelper = new ngivrFormHelper({
                            $scope: $scope,
                            dialogOptions: options,
                            schema: 'measuringInstrument',
                            onNewModel: () => {
                                $scope.model = {
                                    name: undefined,
                                    macId: undefined,
                                    pointCloudUrl: undefined,
                                    thermalUrl: undefined,
                                    pointMeasureUrl: undefined,
                                 //   videoUrl: undefined,
                                }
                            },
                            formName: 'thermoMeasuringInstrumentForm',
                            onAutoUnlockOrError: () => {
                                if (popupInpopup) {
                                    $mdDialog.cancel()
                                }
                            }
                        })

                   },
                })

            } catch (e) {
                ngivrException.handler(e)
            }

        }
    }

})
