'use strict';
ngivr.angular.directive('ngivrAutocompleteCarrier', function (ngivrService, ngivrAutocomplete) {

    return ngivrAutocomplete.generate({
        scope: {
            //sellerChanged: '&'
            disabled: '=ngDisabled',
        },
        text: "carrier.name",
        placeholder: ngivr.strings.autocomplete.carrier,
        template: "{{ carrier.name}}",
        //label: ngivr.strings.field.buyer,
        schema: 'carrier',
        query: (searchText) => {
            let query = {sort: 'name'};
            query.search = {
                name: {
                    '$regex': searchText,
                    '$options': 'i'
                },
                approved: true
            };
            return query
        }
    });

});
