'use strict';
ngivr.angular.directive('ngivrFullWidth', () => {
    return {
        restrict: 'A',
        link: (scope, element) => {
            $(element).css('width', '100%');
        }
    }
});
