'use strict';
ngivr.angular.factory('ngivrBankAccount', ($mdDialog, ngivrApi) => {

    return {

        /**
         * Bankszámlaszám hozzáadása
         * @param model
         */
        addBankAccountNumber: (model) => {
            $mdDialog.show({
                controller: DialogController,
                templateUrl: 'components/ui/popup/addBankAccountNumber/ngivr-popup-add-bank-account-number.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true,
                locals: {model: model}
            })
                .then(function (answer) {
                    // $scope.status = 'You said the information was "' + answer + '".';
                }, function () {
                    //$scope.status = 'You cancelled the dialog.';
                });

            function DialogController($scope, $mdDialog, model, ngivrService, ngivrGrowl, Common) {
                $scope.ngivr = ngivrService;
                $scope.here = {number: undefined, isIban: false, default: true};
                $scope.model = model;
                $scope.hide = function () {
                    $mdDialog.hide();
                };
                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
                $scope.answer = async function (answer) {
                    if ($scope.ngivr.form.validate($scope.addBankAccountForm)) {
                        try {
                            let conto = $scope.here;
                            let partner = angular.copy($scope.model.seller ? $scope.model.seller : $scope.model.incomingSeller);
                            if (partner instanceof Array) {
                                partner = partner[0];
                            }

                            if (!partner.conto) {
                                partner.conto = []
                            }
                            if (partner.conto.length) {
                                let idx = Common.functiontofindIndexByKeyValue(partner.conto, 'default', true);
                                if (idx !== null) {
                                    partner.conto[idx].default = false
                                }

                            }
                            if (partner.conto[0] === '') {
                                partner.conto[0] = conto
                            } else {
                                partner.conto.push(conto)
                            }
                            await ngivrApi.save('partner', partner);
                            $scope.model.bankAccountNumber = conto.number;
                            $scope.model.incomingBankAccountNumber = conto.number;
                            ngivrGrowl('Partner bankszámlaszáma rögzítve lett.')
                        } catch (e) {
                            console.error(e);
                            ngivrGrowl('Partner adatok frissítése nem sikerült, hiányos adatok miatt. A módosítást a Törzsadatok/Partnerek menüpontban végezheti el.')

                        }
                        $mdDialog.hide(answer);
                    }

                };
            }
        },
    }
});
