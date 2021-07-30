'use strict';
ngivr.angular.directive('ngivrAutocompletePartnerMore', function (ngivrService, ngivrAutocomplete) {

    return ngivrAutocomplete.generate({
        scope: {
            loadInvoiceNumber: '&?',
            getDepots: '&?',
            getProductsInDepots: '&?',
            disabled: '=ngDisabled',
            siteId: '<?'
        },
        text: "partner.name",
        placeholder: ngivr.strings.autocomplete.choosePartner,
        template: "{{ (partner.shortName ? partner.shortName : partner.name) + ', ' + partner.vatNumbers[0].number + ', ' + partner.address.zipCode.zipCode + ' ' + partner.address.city + ((partner.address.address === '' || partner.address.address === undefined) ? '' : ', ') + partner.address.address }}",
        //label: ngivr.strings.field.buyer,
        schema: 'partner',
        query: (searchText) => {
            let query = {sort: 'name'};
            query.search = {
                $or: [
                    {
                        name: {
                            '$regex': searchText,
                            '$options': 'i'
                        }
                    },
                    {
                        shortName: {
                            '$regex': searchText,
                            '$options': 'i'
                        }
                    }
                ]
                ,
                approved: true
            };
            return query
        },
        selectedItemChange: (partner, scope) => {
            if (scope.loadInvoiceNumber)
                scope.loadInvoiceNumber({partner: partner});
            if (scope.getDepots)
                scope.getDepots({options: {partnerId: partner ? partner._id : undefined}});
            if (scope.getProductsInDepots) {
                let query = partner ? {partnerId: partner._id} : {sygnus: false};
                if (scope.siteId) {
                    query.siteId = scope.siteId
                }
                scope.getProductsInDepots({
                    options: {
                        type: 'partner',
                        query: query
                    }
                });
            }
        },
    });
});
