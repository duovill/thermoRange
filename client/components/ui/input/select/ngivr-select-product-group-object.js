'use strict';
ngivr.angular.directive('ngivrSelectProductGroupObject', function (ngivrService, ngivrInput) {

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            selectedChanged: '&?',
            all: '<?'
        },
        template: `
<md-select class="ngivr-select" ng-model="model" ng-model-options="{ trackBy: '$value._id'}" md-on-close="selectedChanged()" >
  <md-option ng-repeat="group in productGroups" ng-value="group"  >
    {{ group.name }}
  </md-option>
</md-select>
`,
        link: function (scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);

            const dataQuery = ngivrService.data.query({
                $scope: scope,
                schema: 'productGroup',
                subscribe: async (promise) => {
                    try {
                        const response = await promise;
                        const data = Object.assign({}, response.data);
                        scope.productGroups = data.docs;
                        if (scope.all) scope.productGroups.unshift({name: 'Összes', _id: 1})
                        delete data['docs'];
                    } catch (e) {
                        ngivr.growl.error(e);
                    }
                }
            });

            dataQuery.query({
                search: {
                    visible: true
                },
                limit: 0,
                sort: {name: 1}
            })

        },
    }
});
