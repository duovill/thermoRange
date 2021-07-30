//TODO bull
ngivr.angular.component('ngivrMasterQueue', {
  templateUrl: 'app/master/queue/ngivr-master-queue.html',
  controller: function($scope, $state, ngivrService, $interval) {

    $scope.ngivr = ngivrService;
    $scope.$parent.$parent.fullSizeRequired = 1;

    this.$onDestroy = () => {
      $scope.$parent.$parent.fullSizeRequired = 0;
    }

    let iframe;
    this.refresh = () => {
      if (iframe === undefined) {
        iframe = document.getElementById('ngivr-master-queue-iframe');
      }
      iframe.src = iframe.contentWindow.location.href
    }

    /*
    $interval(() => {
      this.refresh();
    }, 5000)
    */
    $scope.url = `${location.origin}/arena`;
    this.go = (url) => {
      $state.go(url);
    }

  }
});
