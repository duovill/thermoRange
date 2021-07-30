'use strict';
ngivr.angular.directive('ngivrSelectServiceContract', function (ngivrService, ngivrInput) {

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            costBearerId: '=',
            disabled: '=ngDisabled',
            getDepots: '&?'
        },
        template: `
<md-select class="ngivr-select"  ng-model="model" ng-disabled="disabled" ng-model-options="{ trackBy: '$value._id'}" md-on-close="serviceContractChanged()">
  <md-option ng-repeat="serviceContract in serviceContracts" ng-value="serviceContract"  >
    {{ serviceContract.name }}
  </md-option>
</md-select>
`,
        link: function (scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);


            const dataQuery = ngivrService.data.query({
                $scope: scope,
                schema: 'serviceContract',
                subscribe: async (promise) => {
                    try {
                        const response = await promise;
                        const data = Object.assign({}, response.data);
                        scope.serviceContracts = data.docs;
                        delete data['docs'];
                    } catch (e) {
                        ngivr.growl.error(e);
                    }
                }
            });

            scope.$watch('costBearerId', function (newVal, oldVal) {
                if (newVal) {
                    dataQuery.query({
                        search: {
                            'partner.0._id': newVal
                        },
                        limit: 0
                    }).then((response) => {
                        scope.serviceContracts = response.data.docs;
                    })
                } else {
                    scope.serviceContracts = []
                }
            });

            scope.serviceContractChanged = () => {
                if (scope.getDepots)
                    scope.getDepots({options: {serviceContractId: scope.model._id}});
            }
        },
    }
});
