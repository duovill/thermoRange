'use strict';
ngivr.angular.directive('ngivrSelectCounties', function (ngivrInput) {
    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel'
        },
        link: function (scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);
        },
        template: `    
      <md-select class="ngivr-select"  ng-model="model" ng-model-options="{ trackBy: '$value.code'}">
        <md-option ng-repeat="i  in ngivr.settings.counties" ng-value="i">
          {{ i.name }}
        </md-option>
      </md-select>
`,
    }
});
