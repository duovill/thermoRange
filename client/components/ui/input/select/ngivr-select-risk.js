'use strict';
ngivr.angular.directive('ngivrSelectRisk', function (ngivrInput) {
  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel'
    },
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);
    },
    template: `    
      <md-select class="ngivr-select" ng-model="model">
        <md-option ng-repeat="i  in ngivr.strings.partner.risks" ng-value="i">
          {{ i }}
        </md-option>
      </md-select>
`,
  }
});
