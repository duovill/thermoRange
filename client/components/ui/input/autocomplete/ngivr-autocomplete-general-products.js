'use strict';
ngivr.angular.directive('ngivrAutocompleteGeneralProduct', function (ngivrService, ngivrAutocomplete, $timeout) {

    return ngivrAutocomplete.generate({
        scope: {
            subType: '=',
            vat: '<?',
            getDepots: '&',
            productChanged: "&?",
            productGroup: '<?',
            disabled: '=ngDisabled',
            fadProducts: '<?'
        },
        text: "product.name",
        placeholder: ngivr.strings.autocomplete.chooseProduct,
        template: "{{ product.name }}",
        //label: ngivr.strings.field.product,
        schema: 'product',
        selectedItemChange: (product, scope) => {
            if (product !== undefined && product.hasOwnProperty('name') && product.name.includes('Előleg')) {
                scope.subType = 'deposit'
            }
            if (product) scope.getDepots({options: {productId: product._id}});

            if (scope.productChanged) {
                //when this event fires the model's value doesn't reflect the selected item
                $timeout(scope.productChanged);
            }
        },
        query: (searchText, scope) => {
            let query = {sort: name};
            query.search = {
                name: {
                    '$regex': scope.subType === 'deposit' ? 'Előleg' : searchText,
                    '$options': 'i'
                },
                visible: true
            };
            if (scope.fadProducts) {
                query.search.vatDirection = 'Fordított ÁFA'
            }
            if (scope.productGroup && scope.productGroup._id !== 1) query.search.productGroupName = scope.productGroup.name;
            if (scope.vat !== undefined) query.search.vat = scope.vat;
            return query
        }
    });

});
