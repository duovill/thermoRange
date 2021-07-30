/**
 * Created by nagydaniel on 2017. 11. 16..
 */
'use strict';
ngivr.angular.directive('ngivrSelectInvoiceDateType', function (ngivrInput) {
  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
    },
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);
    },
    template: `  
      <md-select class="ngivr-select"  ng-model="model">
        <md-option ng-repeat="(key, value) in ngivr.strings.invoice.dateType" ng-value="key">
          {{ value }}
        </md-option>
      </md-select>
`,
  }
});
