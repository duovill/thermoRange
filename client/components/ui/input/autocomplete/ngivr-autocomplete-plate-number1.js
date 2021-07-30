'use strict';
ngivr.angular.directive('ngivrAutocompletePlateNumber1', function (ngivrService, ngivrAutocomplete, $timeout) {

  return ngivrAutocomplete.generate({
    text: "plateNumber._id.plateNumber",
    placeholder: ngivr.strings.autocomplete.plateNumber,
    template: `{{ plateNumber._id.plateNumber }}`,
    schema: 'plateNumber',
    scope: {
      disabled: '=ngDisabled',
      plateNumber2: "=",
      internal: '<?',
      orderId: '<?',
      ledger: '=?',
      plateNumberChanged: '&?'
    },
    query: (searchText) => {
      let query = {sort: 'plateNumber1'};
        query.search = {
          plateNumber1: {
            '$regex': searchText,
            '$options': 'i'
          },
        };
      return query
    },
    url: '/api/orderVehicles/getPlateNumbers',
    selectedItemChange: async (plateNumber, scope) => {
      if (scope.plateNumberChanged) {
        //when this event fires the model's value doesn't reflect the selected item
        await $timeout(scope.plateNumberChanged);
      }
    },

  });

});
