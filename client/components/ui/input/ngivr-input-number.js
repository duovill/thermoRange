'use strict';
ngivr.angular.directive('ngivrInputNumber', function (Common) {
    return {
        restrict: 'E',
        require: 'ngModel',
        scope: {
            value: '=ngModel',
            required: '<?ngRequired',
            disabled: '<?ngDisabled',
            min: '<',
            max: '<',
            idx: '<?',
            brutto: '<?',
            calculate: '&?',
            setDisabled: '&?',
            calculateInvoice: '&?',
            calculateNetto: '&?',
            recalculateDiscountsMore: '&?',
            calculateBoniSummaries: '&?',
            calculateSumPrice: '&?',
            maxDigits: '<?',
            left: '<?',
            calculateBeforeTransport: '&?',
            contractIdx: '<?',
            watchMax: '<?',
            getAvailableLoadedQuantity: '&?',
            type: '<?',
            field: '<?'
        },
        link: function (scope, element, attrs, ngModel) {
            if (attrs.maxDigits) {
                element.find('input').attr({onKeyPress: `if(this.value.length===${attrs.maxDigits}) return false`});
            }
            // if (attrs.name) {
            //     scope.field = attrs.name
            // }
            scope.numToText = Common.numToText;

            if (scope.watchMax) {
                scope.$watch('max', (newVal, oldVal) => {
                    scope.validateNumber(scope.value)
                })
            }

            scope.validateNumber = (value) => {
                if ((scope.min !== undefined && value < Number(scope.min.toFixed(3))) || (scope.max !== undefined && value > Number(scope.max.toFixed(3)))) {
                    ngModel.$setValidity('wrongNumber', false)
                } else {
                    ngModel.$setValidity('wrongNumber', true)
                }
                if (scope.calculate) scope.calculate({
                    value: value,
                    brutto: ngModel.$name === "bruttoWeight",
                    idx: scope.idx
                });
                if (scope.setDisabled) scope.setDisabled({idx: scope.idx, value: scope.value});
                if (scope.calculateInvoice) scope.calculateInvoice({value: value, idx: scope.idx});
                if (scope.calculateNetto) scope.calculateNetto({value: value, brutto: scope.brutto});
                if (scope.recalculateDiscountsMore) scope.recalculateDiscountsMore({value: value});
                if (scope.calculateBoniSummaries) scope.calculateBoniSummaries({pricePerUnit: value, idx: scope.idx});
                if (scope.calculateSumPrice) scope.calculateSumPrice({idx: scope.idx, field: scope.field, value: value})
                if (scope.calculateBeforeTransport) scope.calculateBeforeTransport({
                    options: {
                        idx: scope.idx,
                        field: scope.field,
                        value: value,
                        contractIdx: scope.contractIdx
                    }
                });
                if (scope.getAvailableLoadedQuantity) scope.getAvailableLoadedQuantity({
                    type: scope.type,
                    idx: scope.idx,
                    value: value
                });
                //if (scope.calculateInvoicePrice) scope.calculateInvoicePrice({value: value, idx: scope.idx})
            }
        },
        template: `    
      <input type="number" ng-model="value" ng-style="{'text-align': left ? 'left' : 'right' };" ng-required="required" ng-disabled="disabled" ng-change="validateNumber(value)" style="margin-bottom: 0">
        
      </input>
      <div ng-if="value != null" class="num-to-text" ng-style="{'float': left ? 'left' : 'right' };">
            <span ng-bind="numToText(value)"></span>
          </div>
`,
    }
});
