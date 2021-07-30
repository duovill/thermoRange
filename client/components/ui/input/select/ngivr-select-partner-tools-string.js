'use strict';
ngivr.angular.directive('ngivrSelectPartnerToolsString', function (ngivrService, ngivrInput) {

  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel'
    },
    template: `
<md-select class="ngivr-select"  ng-model="model">
  <md-option ng-repeat="tool in partnerTools" ng-value="tool"  >
    {{ tool }}
  </md-option>
</md-select>
`,
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);

      const dataQuery = ngivrService.data.query({
        $scope: scope,
        schema: 'partnerTool',
        subscribe: async(promise) => {
          try {
            const response = await promise;
            const data = Object.assign({}, response.data);
            scope.partnerTools = [];
            for (let i in data.docs) {
              scope.partnerTools.push(data.docs[i].toolType)
            }
            delete data['docs'];
          } catch(e) {
            ngivr.growl.error(e);
          }
        }
      });

      dataQuery.query({
        limit: 0,
        sort: 'toolType',
      });

    },
  }
});
