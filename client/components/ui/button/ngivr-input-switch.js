'use strict';
ngivr.angular.directive('ngivrInputSwitch', (ngivrService) => {
  return {
    restrict: 'E',
    scope: {
      //letiltott álapot
      ngDisabled: '=',
      //stílusok
      style: '@',
      //további osztályok
      class: '@',
      //bekapcsolt állapot értéke
      ngivrOnValue: '<',
      //kikapcsolt állapot értéke
      ngivrOffValue: '<',
      //bekapcsolt állapot kiírása
      ngivrOnDisplay: '<',
      //kikapcsolt állapot kiírása
      ngivrOffDisplay: '<',
      //modell
      ngModel: '=',
      //cimke, amit az állapotkiírás elé teszünk
      ngivrCaption: '@',
      //minimális szélesség, opcionális min-width="200px"
      minWidth:'@',
      //fix szélesség, opcionális: width="50px;" Default: 100px;
      width:'@',
      isBug:'=',
      isGas:'='
    },
    link: (scope, elm, attrs, ctrl, ngModel) => {
      scope.style = scope.style || '';
      scope.class = scope.class || '';
	  scope.width = scope.width?"width: "+scope.width+";":"";
	  scope.minWidth = "min-width: "+(scope.minWidth?scope.minWidth:"100px")+";";
	  scope.style = scope.width+scope.minWidth+scope.style;
      scope.ngivrOnValue = scope.ngivrOnValue || true;
      scope.ngivrOffValue = scope.ngivrOffValue || false;
      scope.ngivrOnDisplay = scope.ngivrOnDisplay || "on";
      scope.ngivrOffDisplay = scope.ngivrOffDisplay || "off";
      scope.ngivrCaption = scope.ngivrCaption || "EKÁER";
      scope.ngModel = scope.ngModel || false

      scope.ngivr = ngivrService;
      ngivr.event.on.form.enabled(scope, function (ev, value) {

        scope.enabled = value;
      })

      elm.addClass('ngivr-input-switch');


      scope.toggle = function() {
        scope.$apply(() => {
          scope.ngModel = scope.ngModel === scope.ngivrOnValue ? scope.ngivrOffValue : scope.ngivrOnValue;
        })

      };
      elm.on("click", scope.toggle);

      scope.$watch('ngDisabled', () => {
        if (scope.ngDisabled) {
          elm.addClass('ngivr-input-switch-disabled');
        } else {
          elm.removeClass('ngivr-input-switch-disabled');
        }
      });

      scope.$watch('enabled', () => {
        if (scope.enabled !== undefined) {
          if (!scope.enabled) {
            elm.addClass('ngivr-input-switch-disabled');
          } else {
            elm.removeClass('ngivr-input-switch-disabled');
          }
        }
      });

      scope.$watch('ngModel', (newV, oldV) => {
        if (newV == scope.ngivrOnValue) {
          elm.removeClass('ngivr-input-switch-off')
          elm.addClass('ngivr-input-switch-on')
        } else {
          elm.addClass('ngivr-input-switch-off')
          elm.removeClass('ngivr-input-switch-on')
        }
      });

      scope.getDisplayString = () => {
        return scope.ngModel === scope.ngivrOnValue ? scope.ngivrOnDisplay : scope.ngivrOffDisplay;
      };

    },

    template: `
    <div class="md-button waves-effect waves-whitesmoke {{class}}" type="button" aria-label="not-used" style="{{style}}">

      
      <div class="pull-left" ng-if="!isGas && !isBug">
        <i ng-if="ngivrOnValue == ngModel" class="fa fa-toggle-on"></i>
        <i ng-if="ngivrOnValue != ngModel" class="fa fa-toggle-off"></i>
        {{ngivrCaption}}:
      </div>
      <div class="pull-right" ng-if="!isGas && !isBug">
			  {{getDisplayString()}}
			</div>
			  <div ng-if="isGas">
          <img src="../../../assets/images/gas_mask.png" style="height: 24px;" />
        </div>
        <div ng-if="isBug">
          <i class="fa fa-bug"></i>
        </div>
	  </div>`
  }
});
