'use strict';
ngivr.angular.directive('ngivrAutocompleteProducer', function (ngivrService, ngivrAutocomplete) {

  return ngivrAutocomplete.generate({
    scope: {
      sellerChanged: '&'
    },
    text: "partner.name",
    placeholder: ngivr.strings.autocomplete.partner.placeholder,
    template: "{{ partner.name + ', ' + partner.address.city   + ', Adószám: ' + partner.vatNumbers[0].number}}",
    //label: ngivr.strings.field.buyer,
    schema: 'partner',
    query: (searchText) => {
      let query = {sort: 'name'};
      query.search = {
        name: {
          '$regex': searchText,
          '$options': 'i'
        },
        type2: 'Őstermelő',
        approved: true
      };
      return query
    },
    selectedItemChange : (partner,scope) => {
      scope.sellerChanged({seller: partner})

    },
  });

});
