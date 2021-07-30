'use strict';
ngivr.angular.directive('ngivrSelectProduct', function (ngivrService, ngivrInput) {
  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      firstItem: '=',
      productGroupName: '<',
      changeProduct: '&'
    },
    template: `
<md-select class="ngivr-select" ng-model="model"  ng-model-options="{ trackBy: '$value._id'}" md-on-close="changeProduct()">
  <md-option ng-repeat="product in products" ng-value="product"  >
    {{ product.name }}
  </md-option>
</md-select>
`,
    link: function(scope, element, attrs, ngModel)
    {
        ngivrInput.select.link(scope);

        scope.$watch('productGroupName', (newVal, oldVal) =>
        {
            if (newVal === 'Összes') {
              newVal = undefined
            }
            const dataQuery = ngivrService.data.query({
            $scope: scope,
            schema: 'product',
            subscribe: async(promise) => {
                try {
                    const response = await promise;
                    const data = Object.assign({}, response.data);
                    if (data.search.productGroupName === undefined && scope.firstItem !== undefined) {
                      scope.model = {name: 'Összes'}
                    }
                    scope.products = data.docs;
                    if (scope.firstItem !== undefined) {
                    scope.products.unshift(scope.firstItem)
                    }
                } catch(e) {
                ngivr.growl.error(e);
                }
            }
            });

            dataQuery.query({
            search: {
                itemType: 'Sygnus termények',
                productGroupName:  newVal,
                visible: true
            },
            limit: 0
            })
        });



    },
  }
});
