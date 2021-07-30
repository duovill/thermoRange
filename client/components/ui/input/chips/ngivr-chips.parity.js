'use strict';
ngivr.angular.directive('ngivrChipsParity', function (ngivrService, ngivrChips) {

  return ngivrChips.generate({
    display: 'parity.name',
    placeholder: ngivr.strings.autocomplete.parity.placeholder,
    schema: 'parity',
    /**
     command: {
      add: ()=> {
        alert('1');
      },
      remove: ()=> {
        alert('2');
      },
      chipTransform: ($chip) => {
        alert('3');
        return $chip;
      }
    }
     */
    /**
     template: {
      autoComplete: `{{ partner.name }}`,
      chip: `{{ $chip.name }}`
    },
     **/
  });

});
