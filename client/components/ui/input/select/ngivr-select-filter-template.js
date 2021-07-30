'use strict';
ngivr.angular.directive('ngivrSelectFilterTemplate', function (ngivrService, ngivrInput, Auth) {
    return {
      restrict: 'E',
      require: 'ngModel',
      scope: {
        model: '=ngModel',
          loadFilter: '&'
      },
      template: `
<md-select class="ngivr-select" ng-model="model" ng-model-options="{ trackBy: '$value._id'}" md-on-close="loadFilter({template: model})">
  <md-option ng-repeat="filter in filterTemplates" ng-value="filter"  >
    {{ filter.filterName }}
  </md-option>
</md-select>
`,
      link: function(scope, element, attrs, ngModel) {
        ngivrInput.select.link(scope);

        const dataQuery = ngivrService.data.query({
          $scope: scope,
          schema: 'filterTemplate',
          subscribe: async(promise) => {
            try {
              const response = await promise;
              const data = Object.assign({}, response.data);
              scope.filterTemplates = data.docs;
              delete data['docs'];
            } catch(e) {
              ngivr.growl.error(e);
            }
          }
        });

        dataQuery.query({
            search: {
              owner: Auth.getCurrentUserId()
            },
            limit: 0
        })
      },
    }
  });
