'use strict';
ngivr.angular.directive('ngivrSelectCarrier', function (ngivrService, ngivrInput, Auth) {
  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      changeCarrier: '&',
      disabled: '=ngDisabled'
    },
    template: `
<md-select class="ngivr-select" ng-model="model" ng-disabled="disabled" ng-model-options="{ trackBy: '$value._id'}" md-on-close="changeCarrier()">
  <md-option ng-repeat="carrier in carriers" ng-value="carrier"  >
    {{ carrier.name }}
  </md-option>
</md-select>
`,
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);
      if (scope.model !== null && scope.model.name === 'Nincs') {
        scope.model = {name: 'Nincs'}
      }
      scope.carrier = 'Nincs';
      const dataQuery = ngivrService.data.query({
        $scope: scope,
        schema: 'carrier',
        subscribe: async(promise) => {
          try {
            const response = await promise;
            const data = Object.assign({}, response.data);
            scope.carriers = data.docs;
            scope.carriers.unshift({name: 'Nincs'});
            delete data['docs'];
          } catch(e) {
            ngivr.growl.error(e);
          }
        }
      });

      dataQuery.query({
        limit: 0,
        search: {
          approved: true
        }
      })
    },
  }
});
