
'use strict';
ngivr.angular.directive('ngivrAutocompleteParitySettlement', function (ngivrService, ngivrAutocomplete) {

  return ngivrAutocomplete.generate({
    text: 'settlement.name',
    placeholder: ngivr.strings.autocomplete.settlement.placeholder,
    template: `{{ settlement.name }}`,
    schema: 'settlement',
    label: 'Paritás helye',
    query: (searchText) => {
      let query = {sort: 'name'};
      query.search = {
        name: {
          '$regex': searchText,
          '$options': 'i'
        },
        visible: true
      };
      return query
    },
  });

});

