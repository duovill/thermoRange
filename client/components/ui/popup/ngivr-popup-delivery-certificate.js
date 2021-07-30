ngivr.angular.factory('ngivrPopupDeliveryCertificate', function ($mdDialog, ngivrException) {


    return new function () {

        this.show = async(options) => {

            try {
                const result = await $mdDialog.show({
                    controller: function ($scope, ngivrLock) {

                        const $parent = options.$parent;
                        $scope.doc = options.doc;
                        $scope.typeList = $parent.typeList;
                        $scope.ref = $parent;
                        $scope.startBonification = $parent.startBonification;
                        $scope.startStorno = $parent.startStorno;
                        $scope.loadDeliveryCertificate = $parent.loadDeliveryCertificate;


                        // Promise reject
                        $scope.cancel = function (beforeCancel) {
                            if (beforeCancel !== undefined) {
                                $scope[beforeCancel]($scope.doc)
                            }
                            $mdDialog.cancel();
                        };

                        $scope.lock = ngivrLock({
                            scope: $scope,
                            resource: `deliveryCertificate:${$scope.doc._id}`,
                            schema: 'deliveryCertificate',
                            //watchEditing: 'isUpdateWeightEdit',
                            scopeDecorator: {
                                onAutoUnlockOrError: {
                                    //cancelFunction: async () => await $scope.answer()
                                },

                                unlock: {
                                    functionName: ['sendToCorrection', 'hide'],
                                }
                            }
                        });

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

                    },
                    templateUrl: 'components/ui/popup/ngivr-popup-delivery-certificate.html',
                    parent: angular.element(document.body),
                    targetEvent: options.$event,
                    clickOutsideToClose: true,
                    // fullscreen: true // Only for -xs, -sm breakpoints.
                });
                console.warn(result)
            } catch(error) {
                if (error !== undefined) {
                    ngivrException.handler(error)
                }
            }
        }

    };

});
