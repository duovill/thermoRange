'use strict';
ngivr.angular.directive('ngivrSelectWeighingHouse', function (ngivrService, ngivrInput) {

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            siteId: '<?',
            selectChanged: '&?'
        },
        template: `
<md-select class="ngivr-select"  ng-model="model" ng-model-options="{ trackBy: '$value._id'}" md-on-close="selectChanged()">
  <md-option ng-repeat="weighingHouse in weighingHouses" ng-value="weighingHouse" >
    {{ weighingHouse.name + ' (' + weighingHouse.site.name + ')' }}
  </md-option>
</md-select>
`,
        link: function (scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);

            const dataQuery = ngivrService.data.query({
                $scope: scope,
                schema: 'weighingHouse',
                subscribe: async (promise) => {
                    try {
                        const response = await promise;
                        const data = Object.assign({}, response.data);
                        scope.weighingHouses = data.docs;

                        delete data['docs'];
                    } catch (e) {
                        ngivr.growl.error(e);
                    }
                }
            });

            scope.$watch('siteId', (newVal, oldVal) => {
                if (newVal !== oldVal) {
                    dataQuery.query({
                        limit: 0,
                        search: {
                            visible: true,
                            'site': newVal
                        }
                    })
                }
            });

            dataQuery.query({
                limit: 0,
                search: {
                    visible: true
                }
            })
        },
    }
});
