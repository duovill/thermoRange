'use strict';
ngivr.angular.directive('ngivrListHedgeOutgoingInvoices', () => {
  return {
    restrict: 'E',
    scope: {
      ngivrQuery: '=',
      invoice: '=',
      selected: '='
    },
    controllerAs: '$ctrl',
    templateUrl: 'components/ui/list/ngivr-list-hedge-outgoing.html',
    controller: class {

      constructor($scope, Common) {
        this.$scope = $scope;

        //$scope.selectedInvoices = []

        // ha torles van, akkor igy kell hasznalni (ures lesz minden)
        $scope.$on(ngivr.settings.event.client.list.clear, () => {
          $scope.inputSearch = undefined;
        });

        $scope.selectInvoice = (doc, $event) => {
          if ($event !== undefined) {
            $event.stopImmediatePropagation();
          }
          if (!$scope.isSelected(doc._id)) {
            $scope.selected.push(doc._id);
            $scope.publish('invoiceSelect', doc)
          } else {
            $scope.selected.splice($scope.selected.indexOf(doc._id), 1);
            $scope.publish('invoiceDeselect', doc)
          }

        };


        $scope.isSelected = (id) => {
          return $scope.selected.includes(id)
        }
      }
      search(query) {
        const $scope = this.$scope;
        const search = $scope.inputSearch;
        query.search = {
          $or: [
            {
              'buyer.0.name': {
                '$regex':  search,
                '$options': 'i'
              }
            },
            {
              number: {
                '$regex':  search,
                '$options': 'i'
              }
            }
          ],
          paid: false
        };
        query.sort = {'updatedAt' : -1}
      }

      show() {
        alert('show');
      }



    }
  }
});
