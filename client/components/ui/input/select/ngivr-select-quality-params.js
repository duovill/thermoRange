'use strict';
ngivr.angular.directive('ngivrSelectQualityParams', function (ngivrService, ngivrInput) {

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            product: '<'
        },
        template: `
<md-select class="ngivr-select"  ng-model="model" >
  <md-option ng-repeat="param in qualityParams" ng-value="param">
    {{ param + ' (normál érték: ' + qualityParamsFull[$index].value + ')' }}
  </md-option>
</md-select>
`,
        link: function (scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);

            const dataQuery = ngivrService.data.query({
                $scope: scope,
                schema: 'product',
                subscribe: async (promise) => {
                    try {
                        const response = await promise;
                        const data = Object.assign({}, response.data);
                        scope.qualityParams = []
                        scope.qualityParamsFull = data.docs[0].qualityParams
                        for (let param of data.docs[0].qualityParams) {
                            scope.qualityParams.push(param.name);
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
                    _id: scope.product._id,
                    visible: true
                },
                sort: 'createdAt'
            })

        },
    }
});
