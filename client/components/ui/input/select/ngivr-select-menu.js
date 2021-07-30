/**
 * Created by Kovács Marcell on 2017.03.07..
 */
'use strict';
ngivr.angular.directive('ngivrSelectMenu', function (ngivrService, ngivrInput) {

  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',

      role: '=role'
    },
    template: `
<md-select class="ngivr-select" ng-model="model" ng-model-options="{ trackBy: '$value._id'}">
  <md-option ng-repeat="menu in menus" ng-value="menu"  >
    {{ menu.name }}
  </md-option>
</md-select>
`,
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);

        ngivrService.data.all({
          scope: scope,
          schema: 'menu',
          subscribe: (type, item, data) => {
            if (scope.role != undefined)
            {
              scope.menus = data.filter(function (obj) {
                return obj.role.some(function (obj2) {
                  return obj2 == scope.role;
                });
              });
            }
            else
            {
              scope.menus = data;
            }

          }
        })

    },
  }
});
