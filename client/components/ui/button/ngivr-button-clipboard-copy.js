'use strict';
ngivr.angular.directive('ngivrButtonClipboardCopy', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrTooltip: '@',
            ngivrTooltipDirection: '@',
            ngDisabled: '@',
            type: '@',
            ngModel: "<",
            hint: "@",
            ngivrListBtn: "@", //when set the button's height and width will be set to 24 px;,
            ngivrDecorate: '<?'
        },
        link: function (scope, elm, attrs, ctrl) {
            scope.ngivrTooltipDirection = scope.ngivrTooltipDirection || 'top';
            scope.ngivrTooltip = scope.ngivrTooltip || ngivr.strings.clipboard.copyToClipboard;
            scope.hint = scope.hint || "default";
        },
        controller: ($scope, ngivrGrowl) => {
            $scope.click = ($event) => {
                let success = ngivr.clipboard.copy($scope.ngModel, $scope.hint);
                if (success) {
                    ngivrGrowl.warning(ngivr.strings.clipboard.copySuccesful + "<br>" + $scope.ngModel)
                } else {
                    ngivrGrowl.error(ngivr.strings.clipboard.copyFailed)
                }
            }
        },
        template: `
    <md-button class="ngivr-button-clipboard md-raised {{ngivrListBtn?'ngivr-button-clipboard-list':''}}" ng-class="{'ngivr-button-clipboard-toolbar': ngivrDecorate }" ng-disabled="ngDisabled" aria-label="ngivrIconFa" ng-click="click($event)">
      <!--<md-tooltip ng-if="ngivrTooltip" md-direction="{{ ngivrTooltipDirection }}">{{ ngivrTooltip }}</md-tooltip>-->
      <i class="fa fa-clone" aria-hidden="true"></i>
    </md-button>
	`
    }
});
