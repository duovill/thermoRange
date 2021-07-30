'use strict';
ngivr.angular.directive('ngivrSelectStripping', function (ngivrService, ngivrInput) {

  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
    },
    template: `
      <md-select class="ngivr-select"  ng-model="model">
        <md-option ng-repeat="item in ngivr.settings.stripping" ng-value="item.value">
          {{ item.name }}
        </md-option>
      </md-select>
`,
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);
      if (ngivrSettings.stripping === 1) scope.model = ngivrSettings.stripping[0];

      // const dataQuery = ngivrService.data.query({
      //   $scope: scope,
      //   schema: 'ship',
      //   subscribe: async(promise) => {
      //     try {
      //       const response = await promise;
      //       const data = Object.assign({}, response.data);
      //       scope.ships = data.docs;
      //       if (scope.ships.length === 1) scope.model = scope.ships[0];
      //       delete data['docs'];
      //     } catch(e) {
      //       ngivr.growl.error(e);
      //     }
      //   }
      // });
      //
      // dataQuery.query({
      //   limit: 0,
      //   search: {
      //     cargoPlanId: scope.cargoPlanId,
      //     isClosed: false,
      //     deleted: false,
      //   },
      //   sort: 'createdAt'
      // })

    },
  }
});
