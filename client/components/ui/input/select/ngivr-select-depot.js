'use strict';
ngivr.angular.directive('ngivrSelectDepot', function (ngivrService, ngivrInput) {

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            siteId: '=',
            disabled: '=ngDisabled',
            setDepot: '&?'
        },
        template: `
<md-select class="ngivr-select" ng-disabled="disabled" ng-model="model" ng-model-options="{ trackBy: '$value._id'}" md-on-close="setDepot({depot: model})">
  <md-option ng-repeat="depot in depots" ng-value="depot"  >
    {{ depot.name }}
  </md-option>
</md-select>
`,
        link: function (scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);
            scope.$watch('siteId', function (newVal, oldVal) {

                const dataQuery = ngivrService.data.query({
                    schema: 'depot',
                    $scope: scope,
                    subscribe: async (promise) => {
                        try {
                            const response = await promise;
                            const data = Object.assign({}, response.data);
                            scope.depots = data.docs;
                            delete data['docs'];
                        } catch (e) {
                            ngivr.growl.error(e);
                        }
                    }
                });

                if (newVal) {
                    dataQuery.query({
                        search: {
                            'site.0._id': newVal,
                            visible: true
                        },
                        limit: 0
                    })
                } else {
                    scope.depots = []
                }


                /*const dataQuery = ngivrService.data.query({
                  schema: 'depot',
                  $scope: scope
                });

                if (newVal) {
                  dataQuery.query({
                        search: {
                          'site.0._id': newVal,
                          visible: true
                        },
                        limit: 0
                    }).then((response) => {
                      scope.depots = response.data.docs;
                    })
                } else {
                  scope.depots = []
                }*/

            });


        },
    }
});
