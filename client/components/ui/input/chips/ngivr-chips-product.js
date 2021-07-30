'use strict';
ngivr.angular.directive('ngivrChipsProduct', function (ngivrService, ngivrChips) {

  return ngivrChips.generate({
    display: 'product.name',
    placeholder: ngivr.strings.autocomplete.product.placeholder,
    schema: 'product',
    query: (searchText) => {
      return {
        'sort': 'name',
        'search': {
          'name': {
            '$regex': searchText,
            '$options': 'i'
          },
          'itemType': 'Sygnus termények'
        }
      };
    }

  });

});
