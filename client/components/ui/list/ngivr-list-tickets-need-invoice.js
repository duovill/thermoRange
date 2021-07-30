'use strict';
ngivr.angular.directive('ngivrListTicketsNeedInvoice', () => {
  return {
    restrict: 'E',
    scope: {
      ngivrQuery: '=',
      invoice: '=',
      variables: '=',
      checkVat: '&'

    },
    controllerAs: '$ctrl',
    templateUrl: 'components/ui/list/ngivr-list-tickets-need-invoice.html',
    controller: class {

      constructor($scope, Common, ngivrSocketLock, socket, Auth, ngivrApi) {
        this.$scope = $scope;
        $scope.socketService = ngivrSocketLock;
        $scope.currentUser = Auth.getCurrentUser();
        $scope.selects = {
          orders: [],
          tickets: []
        };

        $scope.detailedOrders = [];

        $scope.locklist = [];

        socket.socket.on(ngivr.settings.socket.event.lock.list.update, function (data) {
          $scope.locklist = data.data;
        });
        $scope.socketService.get();

      }
    }
  }
});
