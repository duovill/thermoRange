'use strict';
ngivr.angular.component('ngivrIconStatic', {
  bindings: {
    'ngivrTooltip': '@',
    'ngivrTooltipDirection': '@',
    'ngivrIcon': '@',
    'extraClass': '@',
    'type': '@',
    ngDisabled: '=',
    ngClick: '&'
  },
  template: `
  <button type="{{ $ctrl.type }}" ng-disabled="$ctrl.ngDisabled" md-ink-ripple ng-click="$ctrl.click()" class="ngivr-icon-static ngivr-icon-static-{{ $ctrl.ngivrIcon }} {{ $ctrl.extraClass }} ripple">
     <md-tooltip ng-if="$ctrl.ngivrTooltip" md-direction="{{ $ctrl.ngivrTooltipDirection }}">{{ $ctrl.ngivrTooltip }}</md-tooltip>
		 <img src="{{ $ctrl.imageSource }}"/>
	</button>
`,
  controller: class {
    $onInit() {
      if (this.ngivrTooltipDirection == undefined) {
        this.ngivrTooltipDirection = 'top';
      }
      this.imageSource =  '/assets/icons/static/' + this.ngivrIcon  + '.png';
      this.type = this.type == undefined ? 'button' : this.type;
    }
  }
});
