'use strict';
ngivr.angular.directive('ngivrAutocompleteCountry', function (ngivrService, ngivrAutocomplete) {

  return ngivrAutocomplete.generate({
    scope: {
      model: '='
    },
    text: 'countryCode.name',
    placeholder: ngivr.strings.autocomplete.country.placeholder,
    template: `{{ countryCode.name + ', ' + countryCode.code }}`,
    schema: 'countryCode',
    //label: ngivr.strings.field.country,
    query: (searchText) => {
      let query = {sort: 'name'};
      query.search = {
        name: {
          '$regex': searchText,
          '$options': 'i'
        },
      };
      return query
    },
    /*selectedItemChange : (country, scope) => {

      if (scope.model.address !== undefined) {
        scope.model.address.zipCode = {}
        scope.model.address.city = undefined
      } else {
        scope.model.zipCode = {}
        scope.model.city = undefined
      }
    },*/
  });

});
