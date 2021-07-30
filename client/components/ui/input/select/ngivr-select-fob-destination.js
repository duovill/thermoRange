'use strict';
ngivr.angular.directive('ngivrSelectFobDestination', function (ngivrService, ngivrInput) {

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            justName: '<?'
        },
        template: `
<md-select ng-if="!justName" class="ngivr-select"  ng-model="model" ng-model-options="{ trackBy: '$value._id'}">
  <md-option ng-repeat="fob in fobDestinations" ng-value="fob"  >
    {{ fob.name }}
  </md-option>
</md-select>
<md-select ng-if="justName" class="ngivr-select"  ng-model="model">
  <md-option ng-repeat="fob in fobDestinations" ng-value="fob"  >
    {{ fob }}
  </md-option>
</md-select>
`,
        link: function (scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);

            const dataQuery = ngivrService.data.query({
                $scope: scope,
                schema: 'fobDestination',
                subscribe: async (promise) => {
                    try {
                        const response = await promise;
                        const data = Object.assign({}, response.data);
                        if (scope.justName) {
                            scope.fobDestinations = [];
                            for (let i in data.docs) {
                                scope.fobDestinations.push(data.docs[i].name)
                            }
                        } else {
                            scope.fobDestinations = data.docs;
                        }

                        delete data['docs'];
                    } catch (e) {
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
