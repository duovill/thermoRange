'use strict';
ngivr.angular.directive('ngivrSelectPartnerToolkit', function (ngivrService, ngivrInput) {

  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      partnerId: '<',
    },
    template: `
<md-select class="ngivr-select"  ng-model="model" ng-model-options="{ trackBy: '$value._id'}">
  <md-option ng-repeat="item in items" ng-value="item"  >
    {{ item.toolkitName }}
  </md-option>
</md-select>
`,
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);

      scope.$watch('partnerId',function(newVal, oldVal) {
        const dataQuery = ngivrService.data.query({
          $scope: scope,
          schema: 'partnerToolkit',
          subscribe: async (promise) => {
            try {
              const response = await promise;
              const data = Object.assign({}, response.data);
              scope.items = data.docs;
              if (scope.items.length === 1) scope.model = scope.items[0];
              delete data['docs'];
            } catch (e) {
              ngivr.growl.error(e);
            }
          }
        });

        dataQuery.query({
          limit: 0,
          search: {
            partnerId: newVal === undefined ? null: newVal,
          },
          sort: 'createdAt'
        })
      })
    },
  }
});
