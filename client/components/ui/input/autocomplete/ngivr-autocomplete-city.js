'use strict';
ngivr.angular.directive('ngivrAutocompleteCity', function (ngivrService, ngivrAutocomplete) {

  return ngivrAutocomplete.generate({
    text: 'settlement.name',
    placeholder: ngivr.strings.autocomplete.settlement.placeholder,
    template: `{{ settlement.name }}`,
    schema: 'settlement',
    //queryText:'city',
    label: 'Város',
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
