'use strict';
ngivr.angular.directive('ngivrAutocompletePartner', function (ngivrService, ngivrAutocomplete, $timeout) {

    return ngivrAutocomplete.generate({
        text: 'partner.name',
        placeholder: ngivr.strings.autocomplete.partner.placeholder,
        template: `{{ partner.name }}`,
        schema: 'partner',
        scope: {
            disabled: '=ngDisabled',
            vatNumber: '=?',
            partnerChanged: '&?'
        },
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
        },
        selectedItemChange: (partner, scope) => {
            if (scope.partnerChanged) {
                //when this event fires the model's value doesn't reflect the selected item
                $timeout(scope.partnerChanged);
            }
            if (scope.vatNumber) {
                if (partner === undefined) {
                    scope.vatNumber = ''
                } else {
                    if (partner.sygnus) {
                        scope.vatNumber = partner.vatNumbers[0].number
                    } else {
                        if (partner.vatNumbers.length === 1) {
                            scope.vatNumber = partner.vatNumbers[0].number
                        }
                        {
                            scope.vatNumber = ''
                        }
                    }

                }
            }

        },
    });

});
