'use strict';
ngivr.angular.directive('ngivrSelectCurrencyString', function (ngivrService, ngivrInput) {

  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      changeCurrency: '&?'
    },
    template: `
<md-select class="ngivr-select"  ng-model="model" md-on-close="changeCurrency()">
  <md-option ng-repeat="currency in currencies" ng-value="currency"  >
    {{ currency }}
  </md-option>
</md-select>
`,
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);


      // ngivrService.data.all({
      //   scope: scope,
      //   schema: 'currency',
      //   subscribe: (type, item, data) => {
      //     scope.currencies = []
      //     for (let i in data) {
      //       scope.currencies.push(data[i].name)
      //     }
      //
      //   }
      // })

      const dataQuery = ngivrService.data.query({
        $scope: scope,
        schema: 'currency',
        subscribe: async(promise) => {
          try {
            const response = await promise;
            const data = Object.assign({}, response.data);
            scope.currencies = [];
            for (let i in data.docs) {
              scope.currencies.push(data.docs[i].name)
            }

         //   scope.currencies = data.docs;
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
    },
  }
});
