'use strict';
ngivr.angular.directive('ngivrAutocompleteVehicle', function (ngivrService, ngivrAutocomplete) {

  return ngivrAutocomplete.generate({
    text: 'orderVehicle.plateNumber1.name',
   // placeholder: ngivr.strings.autocomplete.settlement.placeholder,
    template: `{{ orderVehicle.plateNumber1 }}`,
    schema: 'orderVehicle',
    scope: {
      orderId: '<'
    },
    //queryText:'city',
    //label: 'Rendszám',
    query: (searchText, scope) => {
      let query = {sort: 'plateNumber1'};
      query.search = {
        orderId: scope.orderId,
        plateNumber1: {
          $regex: searchText,
          $options: 'i'

          }
        };

      return query
    },
  });

});
