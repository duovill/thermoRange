'use strict';
ngivr.angular.directive('ngivrSelectFobDestinationString', function (ngivrService, ngivrInput) {

  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      firstItem: '<',
      required: '<?ngRequired',
      changeFobDestination: '&'
    },
    template: `
<md-select class="ngivr-select"  ng-model="model" ng-required="required" md-on-close="changeFobDestination()">
  <md-option ng-repeat="fob in fobDestinations" ng-value="fob"  >
    {{ fob }}
  </md-option>
</md-select>
`,
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);
      scope.model = 'Összes';
      const dataQuery = ngivrService.data.query({
        $scope: scope,
        schema: 'fobDestination',
        subscribe: async(promise) => {
          try {
            scope.fobDestinations = [];
            if (scope.firstItem !== undefined) {
              scope.fobDestinations = [scope.firstItem]
            }
            const response = await promise;
            const data = Object.assign({}, response.data);
            for (let i in data.docs) {
              scope.fobDestinations.push(data.docs[i].name)
            }
            delete data['docs'];
          } catch(e) {
            ngivr.growl.error(e);
          }
        }
      });

      dataQuery.query({
        limit: 0,
        search: {
          visible: true
        },
        sort: 'createdAt'
      })

    },
  }
});
