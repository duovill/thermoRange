ngivr.angular.directive('ngivrSelectStatusOfContract', function (ngivrInput) {
    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
            required: '<?ngRequired',
            prevContractStatus: '<',
            tabIdx: '<?',
            changeContractStatus: '&'
        },
        link: function (scope, element, attrs, ngModel) {
            ngivrInput.select.link(scope);
            scope.previousModelValue = scope.prevContractStatus
            scope.$watch('model', (newVal, oldVal) => {
                if (newVal !== oldVal) {
                    scope.previousModelValue = oldVal
                }
            })
        },
        template: `    
      <md-select class="ngivr-select" ng-model="model" ng-required="required" md-on-close="changeContractStatus({options: { tabIdx: tabIdx}})">
        <md-option ng-repeat="status in ngivr.strings.contractStatuses" ng-value="status.value">
          {{ status.name }}
          
        </md-option>
      </md-select>
`,
    }
});
