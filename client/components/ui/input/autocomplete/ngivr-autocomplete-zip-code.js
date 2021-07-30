'use strict';
ngivr.angular.directive('ngivrAutocompleteZipCode', function (ngivrService, ngivrAutocomplete) {

  return ngivrAutocomplete.generate({
    scope: {
      city: '='
    },
    text: 'zipCode.zipCode',
    placeholder: ngivr.strings.autocomplete.zipCode.placeholder,
    template: ` {{ zipCode.zipCode + ', ' + zipCode.settlement }}`,
    schema: 'zipCode',
    //queryText: 'zipCode',
    //label: ngivr.strings.field.zipCode,
    query: (searchText) => {
      let query = {sort: 'zipCode'};
      query.search = {
        zipCode: {
          '$regex': searchText,
          '$options': 'i'
        },
        visible: true
      };
      return query
    },
    selectedItemChange: async (zipCode, scope) => {
      if (zipCode !== undefined) {
          if (zipCode.settlement) {
              scope.city = zipCode.settlement
          }

      } else {
        scope.city = undefined
      }
      scope.value = zipCode;
    }
  });

});
