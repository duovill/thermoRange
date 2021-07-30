/* jshint undef: true, unused: true, esversion: 6*/
/* global ngivr */
'use strict';
ngivr.angular.directive('ngivrButtonClipboardPaste', () => {
  return {
    restrict: 'E',
    scope: {
      ngivrTooltip: '@',
      ngivrTooltipDirection: '@',
      ngDisabled: '<',
	  type: '@',
	  ngModel: "=",
	  hint: "@",
      ngivrListBtn:"@",
      valueBeforePaste: "=?"
    },
    link: function(scope, elm, attrs, ctrl) {
    	scope.ngivrTooltipDirection = scope.ngivrTooltipDirection||'top';
		scope.ngivrTooltip = scope.ngivrTooltip||ngivr.strings.clipboard.pasteFromClipboard;
		scope.hint = scope.hint||"default";
    },
	controller:($scope)=>{
		$scope.click=($event)=>{
		    $scope.valueBeforePaste = $scope.ngModel;
			$scope.ngModel=ngivr.clipboard.paste();
		};
		$scope.checkHint=()=>{
			if (!ngivr.clipboard.data) {
				return true;
			}
			if ($scope.hint=='default') {
				return false;
			}
			return $scope.hint?ngivr.clipboard.getHint()!==$scope.hint:false;
		}
	},
    template: `
    <md-button class="md-raised {{ngivrListBtn?'ngivr-button-clipboard-list':''}}" ng-disabled="ngDisabled || checkHint()" aria-label="ngivrIconFa" ng-click="click($event)">
      <!--<md-tooltip ng-if="ngivrTooltip" md-direction="{{ ngivrTooltipDirection }}">{{ ngivrTooltip }}</md-tooltip>-->
      <i class="fa fa-clipboard" aria-hidden="true"></i>
    </md-button>
	`
  }
});
