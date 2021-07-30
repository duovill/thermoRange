'use strict';
ngivr.angular.directive('ngivrSelectQuayBerth', function (ngivrService, ngivrInput) {

  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      quayBerthInShip: '<',
      siteId: '<',
      //setQuayBerth : '&'
    },
    template: `
<md-select class="ngivr-select"  ng-model="model" >
  <md-option ng-repeat="berth in quayBerth" ng-value="berth">
    {{ berth }}
  </md-option>
</md-select>
`,
    link: function (scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);

      scope.$watch('quayBerthInShip', function (newValue, oldValue) {
        if (newValue === oldValue && scope.model === undefined && scope.quayBerthInShip !== undefined) {
          return;
        }
        const dataQuery = ngivrService.data.id({
          $scope: scope,
          schema: 'site',
          id: scope.siteId,
          subscribe: async (promise) => {
            try {
              const response = await promise;
              const data = Object.assign({}, response.data);
              if (scope.quayBerth === undefined) scope.quayBerth = data.doc.quayBerth;
              if (scope.model === undefined) scope.model = scope.quayBerthInShip;
              if (newValue !== oldValue) scope.model = scope.quayBerthInShip;
              delete data['docs'];
            } catch (e) {
              ngivr.growl.error(e);
            }
          }
        });
      });
    },
  }
});
