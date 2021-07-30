'use strict';
ngivr.angular.directive('ngivrSelectShip', function (ngivrService, ngivrInput) {

  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      cargoPlanId: '<',
      cargoPlanName: '<',
      targetDepot: '=',
      shipMessage: '=',
      orderDirection: '=',
      //hideShip: '=',
      fullTicketLoaded: '<?'
    },
    template: `
<md-select class="ngivr-select"  ng-model="model" ng-model-options="{ trackBy: '$value._id'}">
  <md-option ng-repeat="ship in ships" ng-value="ship"  >
    {{ ship.name + ' - ' + cargoPlanName + ' (' + (ship.loadedQuantity | number: 3) + ' mt)' }}
  </md-option>
</md-select>
`,
    link: function (scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);

      const dataQuery = ngivrService.data.query({
        $scope: scope,
        schema: 'ship',
        subscribe: async (promise) => {
          try {
            const response = await promise;
            const data = Object.assign({}, response.data);
            scope.ships = data.docs;
            if (!scope.ships.length) {
              if (scope.orderDirection === 'external_in') {
                scope.targetDepot = true;
              } else {
                //scope.hideShip = true
              }
              scope.shipMessage = 'Nincs rakodható hajó!';
              scope.model = undefined
            }
            if (scope.ships.length === 1) scope.model = scope.ships[0];
            if (scope.ships.length) scope.shipMessage = undefined;
            delete data['docs'];
          } catch (e) {
            ngivr.growl.error(e);
          }
        }
      });
      if (scope.fullTicketLoaded) {
        dataQuery.query({
          limit: 0,
          search: {
            cargoPlanId: scope.cargoPlanId
          },
          sort: 'createdAt'
        })
      } else {
        dataQuery.query({
          limit: 0,
          search: {
            cargoPlanId: scope.cargoPlanId,
            isClosed: false,
            deleted: false,
          },
          sort: 'createdAt'
        })
      }


    },
  }
});
