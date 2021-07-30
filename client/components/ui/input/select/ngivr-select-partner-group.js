'use strict';
ngivr.angular.directive('ngivrSelectPartnerGroup', function (ngivrInput) {
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
      <md-select class="ngivr-select"   ng-model="model" required>
        <md-option ng-repeat="(key, value)   in ngivr.strings.partner.partnerGroups" ng-value="key">
          {{ value }}
        </md-option>
      </md-select>
`,
  }
});
