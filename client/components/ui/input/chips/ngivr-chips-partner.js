'use strict';
ngivr.angular.directive('ngivrChipsPartner', function (ngivrService, ngivrChips) {

  return ngivrChips.generate({
    display: 'partner.name',
    placeholder: ngivr.strings.autocomplete.partner.placeholder,
    schema: 'partner',

    /*
    command: {
      add: ()=> {
      },
      remove: ()=> {
      },
      chipTransform: ($chip) => {
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
