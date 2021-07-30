'use strict';
ngivr.angular.directive('ngivrSelectProductGroup', function (ngivrService, ngivrInput) {

  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      firstItem: '=',
      changeProductGroup: '&'
    },
    template: `
<md-select class="ngivr-select" ng-model="model"   md-on-close="changeProductGroup()">
  <md-option ng-repeat="group in productGroups" ng-value="group" >
    {{ group }}
  </md-option>
</md-select>
`,
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);
      if (scope.firstItem) scope.model = scope.firstItem;
      const dataQuery = ngivrService.data.query({
        $scope: scope,
        schema: 'productGroup',
        subscribe: async(promise) => {
          try {
            scope.productGroups = [];
            if (scope.firstItem !== undefined) {
              scope.productGroups = [scope.firstItem]
            }
            const response = await promise;
            const data = Object.assign({}, response.data);
            for (let i in data.docs) {
              scope.productGroups.push(response.data.docs[i].name)
            }
          } catch(e) {
            ngivr.growl.error(e);
          }
        }
      });

      dataQuery.query({
        search: {
          visible: true
        },
        limit: 0
      })

    },
  }
});
