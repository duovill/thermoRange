'use strict';
ngivr.angular.directive('ngivrSelectAfaTypes', function (ngivrService, ngivrInput, Auth) {
  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      disabled: '=ngDisabled'
    },
    template: `
<md-select class="ngivr-select" ng-model="model" ng-disabled="disabled" ng-model-options="{ trackBy: '$value._id'}">
  <md-option ng-repeat="type in types" ng-value="type"  >
    {{ type.AFA_NEV + ' - ' + type.AFA_KOD }}
  </md-option>
</md-select>
`,
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);

      const dataQuery = ngivrService.data.query({
        $scope: scope,
        schema: 'afafajta',
        subscribe: async(promise) => {
          try {
            const response = await promise;
            const data = Object.assign({}, response.data);
            scope.types = data.docs;
            delete data['docs'];
          } catch(e) {
            ngivr.growl.error(e);
          }
        }
      });

      dataQuery.query({
        limit: 0,

      })
    },
  }
});
