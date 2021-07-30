'use strict';
ngivr.angular.directive('ngivrAutocompletePartnerPartner', function (ngivrService, ngivrAutocomplete) {

  return ngivrAutocomplete.generate({
    text: 'partner.name',
    placeholder: ngivr.strings.autocomplete.partnerPartner.placeholder,
    template: `{{ partner.name }}`,
    schema: 'partner',
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
        approved: true
      };
      return query
    },
  });

});
