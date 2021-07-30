'use strict';
ngivr.angular.directive('ngivrSelectCurrency', function (ngivrService, ngivrInput) {

  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel'
    },
    template: `
<md-select class="ngivr-select"  ng-model="model" ng-model-options="{ trackBy: '$value._id'}">
  <md-option ng-repeat="currency in currencies" ng-value="currency"  >
    {{ currency.name }}
  </md-option>
</md-select>
`,
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);

      const dataQuery = ngivrService.data.query({
        $scope: scope,
        schema: 'currency',
        subscribe: async(promise) => {
          try {
            const response = await promise;
            const data = Object.assign({}, response.data);
            scope.currencies = data.docs;
            delete data['docs'];
          } catch(e) {
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
        schema: 'currency',
        subscribe: (type, item, data) => {
          scope.currencies = data;
        }
      })*/
    },
  }
});
