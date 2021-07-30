'use strict';


/**
 * Így kell használni pl:
 *
 * csak a sygnus terményeket jeleníti meg:
 * <ngivr-autocomplete-product ng-model="model.valami" item-type="'sygnus'" ng-disabled="feltétel"></ngivr-autocomplete-product>
 *
 * minden terméket megjelenít:
 * <ngivr-autocomplete-product ng-model="model.valami" ng-disabled="feltétel"></ngivr-autocomplete-product>
 *
 * Fontos, hogy mindig csak azokban keres, ahol a visible mező értéke true
 *
 * Konkrét példa a client/components/ui/popup/deposit/ngivr-popup-deposit.html-ben, termény beírásánál
 */
ngivr.angular.directive('ngivrAutocompleteProduct', function (ngivrService, ngivrAutocomplete) {

    return ngivrAutocomplete.generate({
        scope: {
            itemType: '=',
            productGroupName: '<',
            disabled: '=ngDisabled',
            getDepots: '&',
            disabledProductId: '<?'
        },
        text: "product.name",
        placeholder: ngivr.strings.autocomplete.chooseProduct,
        template: "{{ product.name }}",
        //label: ngivr.strings.field.product,
        schema: 'product',
        /*selectedItemChange : (product, scope) => {
          if (product !== undefined && product.hasOwnProperty('name') && product.name.includes('Előleg')) {
            scope.subType = 'deposit'
          }
        },*/
        selectedItemChange: (product, scope) => {

            if (scope.getDepots) scope.getDepots({options: {productId: product ? product._id : undefined}});

            if (scope.productChanged) {
                //when this event fires the model's value doesn't reflect the selected item
                $timeout(scope.productChanged);
            }
        },
        query: (searchText, scope) => {
            let query = {sort: 'name'};
            scope.searchedItemType = undefined;
            if (scope.itemType === 'sygnus') scope.searchedItemType = 'Sygnus termények';
            if (scope.itemType === 'bonification') scope.searchedItemType = 'Bonifikáció';
            query.search = {
                name: {
                    '$regex': scope.subType === 'deposit' ? 'Előleg' : searchText,
                    '$options': 'i'
                },
                itemType: scope.searchedItemType,
                productGroupName: scope.productGroupName || undefined,
                visible: true
            };
            if (scope.disabledProductId) {
                query.search._id = {$ne: scope.disabledProductId}
            }
            return query
        },
    });

});
