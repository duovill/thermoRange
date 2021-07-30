'use strict';
ngivr.angular.directive('ngivrSelectShipItem', function (ngivrService, ngivrInput) {

  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      shipId: '=',
    },
    template: `
<md-select class="ngivr-select"  ng-model="model" ng-model-options="{ trackBy: '$value._id'}">
  <md-option ng-repeat="item in items" ng-value="item"  >
    {{ item.product[0].name + ' - ' + item.partner[0].name + ' - ' + getStripping(item.stripping) + ' (' + (item.volume | number: 3) + ' mt)' }}
  </md-option>
</md-select>
`,
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);
      scope.$watch('shipId',function(newVal, oldVal) {

        const dataQuery = ngivrService.data.query({
          $scope: scope,
          schema: 'ship',
          subscribe: async(promise) => {
            try {
              const response = await promise;
              const data = Object.assign({}, response.data);
              scope.items = data.docs[0].items.filter(function (obj) {
                return obj.deleted == false || obj.deleted == undefined;
              });
              if (data.length === 1) scope.model = scope.model.items[0];
              delete data['docs'];
            } catch(e) {
              ngivr.growl.error(e);
            }
          }
        });

        dataQuery.query({
          limit: 0,
          search: {
            _id: newVal,
            deleted: false,
          },
          sort: 'createdAt'
        })

        scope.getStripping = function (value) {
          let name = '';
          for (let i in ngivrSettings.stripping) {
            if (ngivrSettings.stripping[i].value === value) {
              name = ngivrSettings.stripping[i].name;
            }
          }
          return name
        }
      })
    }
  }
});
