'use strict';
ngivr.angular.directive('ngivrSelectCargoPlan', function (ngivrService, ngivrInput) {

  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      disabled: '=ngDisabled'
    },
    template: `
<md-select class="ngivr-select" ng-disabled="disabled" ng-model="model" ng-model-options="{ trackBy: '$value._id'}">
  <md-option ng-repeat="cargoPlan in cargoPlans" ng-value="cargoPlan"  >
    {{ cargoPlan.name }}
  </md-option>
</md-select>
`,
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);

      const dataQuery = ngivrService.data.query({
        $scope: scope,
        schema: 'cargoPlan',
        subscribe: async(promise) => {
          try {
            const response = await promise;
            const data = Object.assign({}, response.data);
            scope.cargoPlans = data.docs;
            delete data['docs'];
          } catch(e) {
            ngivr.growl.error(e);
          }
        }
      });

      dataQuery.query({
        limit: 0,
        search: {
          deleted: false,
        },
        sort: 'createdAt'
      })

    },
  }
});
