'use strict';
ngivr.angular.directive('ngivrListFinancialCostbearer', () => {
  return {
    restrict: 'E',
    scope: {
      ngivrQuery: '='
    },
    controllerAs: '$ctrl',
    templateUrl: 'components/ui/list/ngivr-list-financial-costbearer.html',
    controller: class {

      constructor($scope) {
        this.$scope = $scope;

        $scope.query = {
        	truck: {

        	},
        	trailer: {

        	}
        }

      }

    }
  }
});
