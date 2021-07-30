'use strict';
ngivr.angular.directive('ngivrSelectVatNumber', function (ngivrService, ngivrInput) {
    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            vatNumbers: "<",
            disabled: '=ngDisabled'
        },
        template: `
<md-select class="ngivr-select" ng-model="model" ng-disabled="disabled">
  <md-option ng-repeat="vatNumber in vatNumbers" ng-value="vatNumber.number">
    {{ vatNumber.number }}
  </md-option>
</md-select>
`,
        link: function (scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);

        },
    }
});
