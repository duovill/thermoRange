'use strict';
ngivr.angular.directive('ngivrListContractsWithoutHedge', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '='
        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-contracts-without-hedge.html',
        controller: function ($scope) {

        }
    }
})
