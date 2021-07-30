'use strict';
ngivr.angular.directive('ngivrAutocompleteTow', function (ngivrService, ngivrAutocomplete) {

    return ngivrAutocomplete.generate({
        scope: {
            trailer: '=',
            country1: '=',
            country2: '='
        },
        position: 'top',
        text: 'financialCostBearer.name',
        placeholder: ngivr.strings.autocomplete.tow.placeholder,
        template: `{{ financialCostBearer.name }}`,
        schema: 'financialCostBearer',
        label: ngivr.strings.field.plateNumber1,
        query: (searchText) => {
            return {
                sort: name,
                search: {
                    name: {
                        '$regex': searchText,
                        '$options': 'i'
                    },
                    costBearerType: 'Tehergépjármű',
                    visible: true
                }
            }
        },
        selectedItemChange: (tow, scope) => {
            if (tow !== undefined && tow.hasOwnProperty('connectedUnits') && tow.connectedUnits.length) {
                //ngivrApi.id('financialCostBearer', tow.connectedUnits[tow.connectedUnits.length - 1]).then((response) => {
                scope.trailer = tow.connectedUnits[0];
                scope.country1 = 'H';
                scope.country2 = 'H';
                //});
            } else {
                if (scope.value != null) {
                    scope.country1 = 'H';
                }
                else {
                    scope.trailer = '';
                    scope.country1 = null;
                    scope.country2 = null;
                }
            }
        }
    });
});
