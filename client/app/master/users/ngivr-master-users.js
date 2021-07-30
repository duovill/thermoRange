ngivr.angular.component('ngivrMasterUsers', {
    templateUrl: 'app/master/users/ngivr-master-users.html',
    controller: function ($scope, $state, ngivrService) {

        $scope.ngivr = ngivrService;
        $scope.$parent.$parent.fullSizeRequired = 1;

        this.$onDestroy = () => {
            $scope.$parent.$parent.fullSizeRequired = 0;
        };

        $scope.show = {form: false};

        $scope.cancel = () => {
            $scope.show.form = false
        };

        $scope.selected = {id: undefined};

        $scope.url = `${location.origin}/users`;
        this.go = (url) => {
            $state.go(url);
        };

        $scope.addUser = () => {
            $scope.show.form = true;
            $scope.selected.id = undefined;
        };

        $scope.showForm = function (id) {
            $scope.show.form = true;
            if (id) {
                $scope.selected.id = id;
            } else {

            }
        };

    }
});
