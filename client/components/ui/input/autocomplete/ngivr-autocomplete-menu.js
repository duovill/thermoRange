/**
 * Created by Kovács Marcell on 2017.03.03..
 */
'use strict';
ngivr.angular.directive('ngivrAutocompleteMenu', function (ngivrService, ngivrAutocomplete) {

  return ngivrAutocomplete.generate({
    text: 'menu.name',
    placeholder: ngivr.strings.autocomplete.settlement.placeholder,
    template: `{{ menu.name }}`,
    schema: 'menu',
    //queryText:'city',
    label: 'Menüpont',
    query: (searchText) => {
      let query = {sort: name};
      query.search = {
        name: {
          '$regex': searchText,
          '$options': 'i'
        },
        visible: true
      };
      return query
    }
  });

});
