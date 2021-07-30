'use strict';
ngivr.angular.directive('ngivrAutocompleteTcn', function (ngivrService, ngivrAutocomplete, $timeout) {

    /**
     * Azért van _id használva, mert az orderVehicle-ből aggregate-tel vannak
     * lekérve a tcn-ek, és a visszakapott tömb-ben _id a property
     */
    return ngivrAutocomplete.generate({
        text: 'orderVehicle._id',
        placeholder: ngivr.strings.autocomplete.tcn,
        template: `{{ orderVehicle._id }}`,
        schema: 'orderVehicle',
        scope: {
            disabled: '=ngDisabled',
            vatNumber: '=?',
            tcnChanged: '&?'
        },
        query: (searchText) => {
            let query = {sort: {'_id': 1}};
            query.search = {
                _id: {
                    '$regex': searchText,
                    '$options': 'i'
                }
            };
            return query
        },
        selectedItemChange: (ekaer, scope) => {
            if (scope.tcnChanged) {
                //when this event fires the model's value doesn't reflect the selected item
                $timeout(scope.tcnChanged);
            }
        },
    });

});
