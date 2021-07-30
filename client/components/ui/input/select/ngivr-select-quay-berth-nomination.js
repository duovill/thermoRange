'use strict';
ngivr.angular.directive('ngivrSelectQuayBerthNomination', function (ngivrService, ngivrInput) {
    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            siteId: '<'
        },
        link: function (scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);

            scope.$watch('siteId', function (newVal, oldVal) {
                const dataQuery = ngivrService.data.query({
                    $scope: scope,
                    schema: 'site',
                    subscribe: async (promise) => {
                        try {
                            const response = await promise;
                            const data = Object.assign({}, response.data);
                            scope.quayBerth = data.docs[0].quayBerth;
                            delete data['docs'];
                        } catch (e) {
                            ngivr.growl.error(e);
                        }
                    }
                });

                if (newVal) {
                    dataQuery.query({
                        limit: 0,
                        search: {
                            _id: scope.siteId
                        },
                        sort: 'createdAt'
                    })
                } else {
                    scope.quayBerth = []
                }
            })

        },
        template: `    
      <md-select class="ngivr-select"  ng-model="model" >
        <md-option ng-repeat="i  in quayBerth" ng-value="i">
          {{ i }}
        </md-option>
      </md-select>
`,
    }
});
