'use strict';
ngivr.angular.directive('ngivrAutocompleteCountryCode', function (ngivrService, ngivrAutocomplete) {

  return ngivrAutocomplete.generate({
    text: 'countryCode.code',
    placeholder: ngivr.strings.autocomplete.code,
    template: `{{ countryCode.code + ', ' + countryCode.name }}`,
    schema: 'countryCode',
    //label: "Országkód",
    //queryText: 'code',
    query: (searchText) => {
      let query = {sort: 'code'};
      query.search = {
        code: {
          '$regex': searchText,
          '$options': 'i'
        },
      };
      return query
    },
  });

});
