'use strict';
ngivr.angular.directive('ngivrSelectGender', function (ngivrInput) {
  return {
    restrict: 'E',
    require: 'ngModel',
    scope: {
      model: '=ngModel',
      required: '<?ngRequired'
    },
    link: function(scope, element, attrs, ngModel) {
      ngivrInput.select.link(scope);


    },
    template: `    
      <md-select class="ngivr-select" ng-model="model" ng-required="required">
        <md-option ng-repeat="i  in ngivr.strings.partner.genders" ng-value="i">
          {{ i }}
        </md-option>
      </md-select>
`,
  }
});
