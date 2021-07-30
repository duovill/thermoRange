'use strict';
ngivr.angular.directive('ngivrButton', () => {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            ngDisabled: '<',
            type: '@',
            style: '@',
            class: '@',
            ngivrType: '@',
            ngivrActive: '<',
            ngivrStyle: '<',
        },
        link: (scope, elm, attrs, ctrl) => {
            //console.warn('ngivrStyle', scope.ngivrStyle)
            if (attrs.type === undefined) {
                attrs.type = 'button';
            }
            if (attrs.style === undefined) {
                attrs.style = '';
            }
//      console.warn('style', attrs)
            if (scope.ngivrType === undefined) {
                scope.ngivrType = 'ngivr-button';
            }
//      scope.debounce= ''
            switch (scope.ngivrType) {
                case 'portal':
                    scope.ngivrTypeClass = 'ngivr-button-portal';
                    break;
                case 'flat':
                    scope.ngivrTypeClass = 'ngivr-button-flat';
                    break;
                default:
                    scope.ngivrTypeClass = 'ngivr-button';
//          scope.debounce = 'ngivr-click-debounce'
                    break;
            }
            scope.$watch('ngivrActive', () => {
                scope.ngivrTypeClassResult = scope.ngivrTypeClass;
                if (scope.ngivrActive === true) {
                    scope.ngivrTypeClassResult += '-active';
                }
            })
            // waves-effect waves-whitesmoke  ngivr-mobile md-button ngivr-button-flat
            // waves-effect waves-whitesmoke  ngivr-list-paginator-button md-button ngivr-button-flat

        },
        template: `<md-button class="waves-effect waves-whitesmoke {{ngivrTypeClassResult}} {{ class }} " type="{{type}}" aria-label="not-used" ng-disabled="ngDisabled" style="{{style}} {{ngivrStyle}}"><ng-transclude></ng-transclude></md-button>`
    }
});
