'use strict';
ngivr.angular.directive('ngivrSelectOwnVatNumbers', function (ngivrService, ngivrInput) {

    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel'
        },
        template: `
<md-select class="ngivr-select"  ng-model="model">
  <md-option ng-repeat="number in vatNumbers" ng-value="number.number"  >
    {{ number.number }}
  </md-option>
</md-select>
`,
        link: function(scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);

            const dataQuery = ngivrService.data.query({
                $scope: scope,
                schema: 'partner',
                subscribe: async(promise) => {
                    try {
                        const response = await promise;
                        const data = Object.assign({}, response.data);
                        scope.vatNumbers = data.docs[0].vatNumbers;
                        delete data['docs'];
                    } catch(e) {
                        ngivr.growl.error(e);
                    }
                }
            });

            dataQuery.query({
                limit: 0,
                search: {
                    sygnus: true
                },
                sort: 'createdAt'
            })

        },
    }
});
