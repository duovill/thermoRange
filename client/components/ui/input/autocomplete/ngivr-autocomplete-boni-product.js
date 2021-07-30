ngivr.angular.directive('ngivrAutocompleteBoniProduct', function (ngivrService, ngivrAutocomplete) {

    return ngivrAutocomplete.generate({
        scope: {
            itemType: '=',
            disabled: '=ngDisabled'
        },
        text: "product.name",
        placeholder: ngivr.strings.autocomplete.boniProduct,
        template: "{{ product.name }}",
        //label: ngivr.strings.field.connectedBoniProduct,
        schema: 'product',
        /*selectedItemChange : (product, scope) => {
          if (product !== undefined && product.hasOwnProperty('name') && product.name.includes('Előleg')) {
            scope.subType = 'deposit'
          }
        },*/
        query: (searchText) => {
            let query = {sort: name};

            query.search = {
                name: {
                    '$regex': searchText,
                    '$options': 'i'
                },
                itemType: 'Bonifikáció',
                visible: true
            };
            return query
        },
    });

});
