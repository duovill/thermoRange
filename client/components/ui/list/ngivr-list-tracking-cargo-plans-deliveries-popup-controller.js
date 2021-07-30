ngivr.angular.controller('NgivrListTrackingCargoPlansDeliveriesPopupController', function ($scope, $mdDialog, ngivrService, ngivrListTrackingCargoPlansDeliveriesMdDialogDoc, ngivrHttp, $window) {

    const self = this;
    // doc._id = cargoPlanId
    $scope.doc = ngivrListTrackingCargoPlansDeliveriesMdDialogDoc;

    $scope.ngivr = ngivrService

    self.ok = function () {
      $mdDialog.hide();
    };

    const cargoCalculation = (cargo) => {
      cargo.total = 0;
      for (let placeIndex in cargo.places) {
        const place = cargo.places[placeIndex];
        place.total = 0;
        for (let orderIndex in cargo.orders) {
          const order = cargo.orders[orderIndex];
          for (let orderPlaceIndex in order.places) {
            const cargoPlace = order.places[orderPlaceIndex];
            if (cargoPlace._id === place._id) {
              place.total += cargoPlace.volume;
            }
          }
        }
        cargo.total += place.total;
      }
    }

    const calculateDisplay = function(newValues, oldValues, scope) {
//      console.log('Resized your browser')

      const shipsTitle = $('.ngivr-list-tracking-plans-deliveries-popup-disposition-ship-portlet .ngivr-portlet-title')
      const itemTitle = $('.ngivr-list-tracking-plans-deliveries-popup-disposition-item-portlet .ngivr-portlet-title')
      itemTitle.height(shipsTitle.height())

      const ships = $('.ngivr-list-tracking-plans-deliveries-popup-disposition');
      const storage = $('.ngivr-list-tracking-plans-deliveries-popup-storage');


      let heights = [];
      ships.each(function( index, element ) {
        const $e = $(this);
        heights.push($e.height());
      });
//        const repeat = storage.length / ships.length;
//        console.log(repeat);
      while (heights.length < storage.length) {
        heights = heights.concat(heights);
      }
      /*
      for(let i = 0; i < repeat; i++) {
        heights = heights.concat(heights);
      }
      */
//        console.log(heights);
      storage.each(function( index, element ) {
        const $e = $(this);
        $e.height(heights[index]);
      });

//      console.log($scope.cargo)
//      console.log($scope.doc)

    }

    const startAsync = async () => {
      const cargoPlanId = ngivrListTrackingCargoPlansDeliveriesMdDialogDoc._id
      const response = await ngivrHttp.get('/api/orders/cargoPlanInfo/' + cargoPlanId);
      cargoCalculation(response.data);
      $scope.cargo = response.data;

      $scope.$watchGroup(['cargo', 'doc'], calculateDisplay);

      const appWindow = angular.element($window);
      appWindow.bind('resize', calculateDisplay);

      $scope.$on('$destroy', function() {
        appWindow.unbind('resize', calculateDisplay);
      });
    }
    startAsync()

  }
)
