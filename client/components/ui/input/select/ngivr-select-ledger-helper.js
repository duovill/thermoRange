'use strict';
ngivr.angular.directive('ngivrSelectLedgerHelper', function (ngivrService, ngivrInput) {

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            onClose: '&?'
        },
        template: `
<md-select class="ngivr-select"  ng-model="model" ng-model-options="{ trackBy: '$value._id'}" md-on-close="onClose()">
  <md-option ng-repeat="ledgerHelper in ledgerHelpers" ng-value="ledgerHelper"  >
    {{ ledgerHelper.name }}
  </md-option>
</md-select>
`,
        link: function (scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);

            const dataQuery = ngivrService.data.query({
                $scope: scope,
                schema: 'ledgerHelper',
                subscribe: async (promise) => {
                    try {
                        const response = await promise;
                        const data = Object.assign({}, response.data);
                        scope.ledgerHelpers = data.docs;
                        delete data['docs'];
                    } catch (e) {
                        ngivr.growl.error(e);
                    }
                }
            });

            dataQuery.query({
                limit: 0,
                search: {
                    visible: true
                }
            })
            /*ngivrService.data.all({
              scope: scope,
              schema: 'ledgerHelper',
              subscribe: (type, item, data) => {
                scope.ledgerHelpers = data;
              }
            })*/
        },
    }
});
