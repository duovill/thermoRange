'use strict';
ngivr.angular.directive('ngivrIconFa', () => {
  return {
    restrict: 'E',
    scope: {
      ngivrTooltip: '@',
      ngivrTooltipDirection: '@',
      ngivrIconFa: '@',
      ngDisabled: '<',
      ngivrColor: '@',
      ngivrMobileClass: '@',
      ngivrFaMargin: '@'
    },
    link: function(scope, elm, attrs, ctrl) {
      if (!attrs.ngivrTooltipDirection) {
        attrs.ngivrTooltipDirection = 'top';
      }
      if (!attrs.ngivrColor) {
        attrs.ngivrColor = 'primary';
      }
      if (ngivr.config.mobile) {
        attrs.ngivrMobileClass = 'ngivr-icon-fa-mobile';
      }

    },
    template: `
    <md-button class="waves-effect btn btn-raised-default ngivr-icon-fa-color-{{ ngivrColor }} {{ ngivrMobileClass }}" ng-disabled="ngDisabled" aria-label="ngivrIconFa">
      <md-tooltip ng-if="ngivrTooltip" md-direction="{{ ngivrTooltipDirection }}">{{ ngivrTooltip }}</md-tooltip>
      <i class="fa {{ ngivrIconFa }}" aria-hidden="true" style="{{ngivrFaMargin}}"></i>
    </md-button>
`
  }
});
