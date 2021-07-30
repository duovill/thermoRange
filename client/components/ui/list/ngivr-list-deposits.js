'use strict';
ngivr.angular.directive('ngivrListDeposits', () => {
    return {
        restrict: 'E',
        scope: {
            ngivrQuery: '=',


        },
        controllerAs: '$ctrl',
        templateUrl: 'components/ui/list/ngivr-list-deposits.html',
        controller: class {

            constructor($scope, socket) {
                this.$scope = $scope;

                const invoiceListener = async () => {
                    //this.search($scope.ngivrQuery);
                    ngivr.list.requery($scope, {force: true, query: $scope.ngivrQuery});

                };

                socket.socket.on('incomingInvoice:save', invoiceListener);

                $scope.$on('$destroy', async () => {
                    socket.socket.removeListener('incomingInvoice:save', invoiceListener);
                });

            }

            loadDeposit(deposit) {
                this.$scope.publish('loadDeposit', deposit)
            }

        }
    }
});
