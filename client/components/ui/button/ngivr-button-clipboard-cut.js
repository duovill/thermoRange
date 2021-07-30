/* jshint undef: true, unused: true, esversion: 6*/
/* global ngivr */
'use strict';
ngivr.angular.directive('ngivrButtonClipboardCut', () => {
  return {
    restrict: 'E',
    scope: {
      ngivrTooltip: '@',
      ngivrTooltipDirection: '@',
      ngDisabled: '@',
	  type: '@',
	  ngModel: "=",
	  hint: "@",
      ngivrListBtn:"@",
    },
    link: function(scope, elm, attrs, ctrl) {
    	scope.ngivrTooltipDirection = scope.ngivrTooltipDirection||'top';
		scope.ngivrTooltip = scope.ngivrTooltip||ngivr.strings.clipboard.cutToClipboard;
		scope.hint = scope.hint||"default";
    },
	controller:($scope,ngivrGrowl)=>{
		$scope.click=($event)=>{
			let success = ngivr.clipboard.cut($scope.ngModel,$scope.hint);
			$scope.ngModel=undefined
			if (success) {
				ngivrGrowl.warning(ngivr.strings.clipboard.cutSuccessful+"<br>"+ngivr.clipboard.paste());
			} else {
				ngivrGrowl.error(ngivr.strings.clipboard.cutFailed);
			}
		};
	},
    template: `
    <md-button class="md-raised {{ngivrListBtn?'ngivr-button-clipboard-list':''}}" ng-disabled="ngDisabled" aria-label="ngivrIconFa" ng-click="click($event)">
      <!--<md-tooltip ng-if="ngivrTooltip" md-direction="{{ ngivrTooltipDirection }}">{{ ngivrTooltip }}</md-tooltip>-->
      <i class="fa fa-scissors" aria-hidden="true"></i>
    </md-button>
`
  };
});
