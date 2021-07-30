'use strict';
ngivr.angular.directive('ngivrListDividerPre', () => {
  return {
    restrict: 'E',
    template: '<span ng-if="$index > 0"><md-divider style="clear: both; margin-top: 5px; margin-bottom: 5px;"></md-divider></span>'
  };
});



