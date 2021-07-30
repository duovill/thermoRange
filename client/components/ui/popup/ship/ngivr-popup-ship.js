ngivr.angular.factory('ngivrPopupShip', function ($mdDialog, ngivrException ) {


    return new function () {

        this.show = async (options) => {

            try {
                const popupObject = {
                    bindToController: true,
                    controller: NgivrPopupShipPopupController, //$controller('NgivrVehiclePopupController'),
                    templateUrl: 'components/ui/popup/ship/ngivr-popup-ship.html',
                    parent: angular.element(document.body),
                    targetEvent: options.$event,
                    clickOutsideToClose: false,
                    fullscreen: true, // Only for -xs, -sm breakpoints.
                    ship: options.ship
                };
                const result = await $mdDialog.show(popupObject);
                console.warn(result)
            } catch (error) {
                if (error !== undefined) {
                    ngivrException.handler(error)
                }
            }
        }

    };

});
