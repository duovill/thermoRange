
'use strict';
ngivr.angular.directive('ngivrAutocompleteSettlement', function (ngivrService, ngivrAutocomplete) {

  return ngivrAutocomplete.generate({
    text: 'settlement.name',
    placeholder: ngivr.strings.autocomplete.settlement.placeholder,
    template: `{{ settlement.name }}`,
    schema: 'settlement',
    label: 'Felrakó település',
    scope: {
      disabled: '=ngDisabled'
    },
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

