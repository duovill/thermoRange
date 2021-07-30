'use strict';
ngivr.angular.directive('ngivrSelectOwnAccountNumbers', function (ngivrService, ngivrInput, ngivrGrowl, Auth) {
    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            disabled: '=?ngDisabled',
            currency: '=?'
        },
        template: `
<md-select class="ngivr-select" ng-model="model" ng-disabled="disabled">
  <md-option ng-repeat="number in ownAccountNumbers" ng-value="number.number"  >
    {{ number.number + (number.name ? (' - ' + number.name) : '') }}
  </md-option>
</md-select>
`,
        link: function (scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);


            scope.$watch('currency', (newVal, oldVal) => {
                if (newVal !== undefined) {
                    const dataQuery = ngivrService.data.id({
                        $scope: scope,
                        schema: 'partner',
                        id: ngivr.settings.ownFirm._id,
                        subscribe: async (promise) => {
                            try {
                                const response = await promise;
                                const data = Object.assign({}, response.data);
                                if (scope.ownAccountNumbers === undefined || (scope.ownAccountNumbers !== undefined && newVal !== oldVal)) {
                                    if (scope.ownAccountNumbers !== undefined && newVal !== oldVal) {
                                        scope.model = undefined;
                                    }
                                    scope.ownAccountNumbers = [];
                                    let counter = 1;
                                    for (let conto of data.doc.conto) {
                                        if (scope.currency && conto.currency !== undefined) {
                                            if (conto.currency === scope.currency) {
                                                scope.ownAccountNumbers.push(conto)
                                            }
                                        } else {
                                            if (counter === 1) {
                                                ngivrGrowl('Sygnus bankszámlaszámoknál nincs megadva a deviza! Összes bankszámlaszám megjelenítve! A bankszámlaszámok devizája a partnertözsben állítható be.');
                                            }
                                            scope.ownAccountNumbers.push(conto)
                                        }
                                        counter++
                                    }
                                }
                                delete data['docs'];
                            } catch (e) {
                                ngivr.growl.error(e);
                            }
                        }
                    });
                }
            })


            // scope.$watch('currency',function(newVal, oldVal) {
            //   dataQuery.query()
            // })

            /*dataQuery.query({

            })*/
        },
    }
});
