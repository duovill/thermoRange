'use strict';
ngivr.angular.directive('ngivListFinancialDocument', () => {
  return {
    restrict: 'E',
    controllerAs: '$ctrl',
    scope: {
      ngivrQuery: '='
    },
    templateUrl: 'components/ui/list/ngivr-list-financial-document.html',
    controller: function ($scope) {
      this.$scope = $scope;
      // ha torles van, akkor igy kell hasznalni (ures lesz minden)


      $scope.sort = {
        position: 'after',
        items: [
          {
            key: 'brutto',
            display: 'Brutto',
            sort: 'bruttoValue'
          }
        ]
      }

      ngivr.list.clear($scope, () => {
        $scope.partnerNev = '';
      })
      Object.defineProperty($scope, 'partnerNev', {
        get: () => {
          return $scope.ngivrQuery.search['$or'][0]['partner.name']['$regex'];
        },
        set: (value) => {
          const query = $scope.ngivrQuery;
          $scope.ngivrQuery.search['$or'] = query.search['$or'].splice(0, 1);
          $scope.ngivrQuery.search['$or'][0]['partner.name']['$regex'] = value;
          if (ngivr.mongoose.isId((value))) {
            $scope.ngivrQuery.search['$or'].push({'_id':value});
          }
          ngivr.list.requery($scope);
        }
      })

    }
  }
});
