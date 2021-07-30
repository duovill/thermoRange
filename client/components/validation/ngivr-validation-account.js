'use strict';

ngivr.angular.directive('ngivrValidationAccount', function ($parse) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elm, attrs, ctrl) {
      ctrl.$validators.ngivrValidationAccount = (modelValue, viewValue) => {

        let settings = $parse(attrs.ngivrValidationAccount)(scope);
        if (ctrl.$isEmpty(modelValue)) return true;

        if (settings.iban) { //ha iban

          let norm = modelValue.replace(/\s/g, '');
          for (let i = 0, len = norm.length; i < len; i++) {
            if ( i < 2 && !isLetter(norm[i])) {
              return false;
            } else if (i >= 2 && i < 4 && isNaN(Number(norm[i]))) {
              return false
            } else if (i >= 4 && !norm[i].match("[a-zA-Z0-9]*")) {
              return false;
            }
          }
          let converted = convert(norm.substr(4) + norm.substr(0, 4));
          return iso7064Mod97_10(converted) === 1
        } else { //ha magyar

          let clear = modelValue.replace(/-/g, ''); // kiszedjük a '-' karaktereket

          for (let i = 0, len = clear.length; i < len; i++) {

            if (isNaN(clear[i]) ) return false;
          }

            // let iban = generateIban(modelValue);
            // let converted = iban.substr(4) + convert(iban.substr(0,2)) + iban.substr(2,2);
            //
            // let ibanVal = iso7064Mod97_10(converted) === 1;

            let number = 0;
            let toValidate = modelValue.substr(0,8);
            if (toValidate.length <8) return false;
            for (let i in toValidate) {
              if (i === '0' || i === '4') {
                number += toValidate[i] * 9;
              } else if (i === '1' || i === '5') {
                number += toValidate[i] * 7;
              } else if (i === '2' || i === '6') {
                number += toValidate[i] * 3;
              } else if (i === '3' || i === '7') {
                number += toValidate[i] * 1;
              }
            }

            return (number % 10 === 0); //&& ibanVal;
          }
      };

      let convertTable = {
        'A' : 10,
        'B' : 11,
        'C' : 12,
        'D' : 13,
        'E' : 14,
        'F' : 15,
        'G' : 16,
        'H' : 17,
        'I' : 18,
        'J' : 19,
        'K' : 20,
        'L' : 21,
        'M' : 22,
        'N' : 23,
        'O' : 24,
        'P' : 25,
        'Q' : 26,
        'R' : 27,
        'S' : 28,
        'T' : 29,
        'U' : 30,
        'V' : 31,
        'W' : 32,
        'X' : 33,
        'Y' : 34,
        'Z' : 35,
      };

      /**
       * Az IBAN számban szereplő betűket számokká alakítja
       * @param string
       * @returns {string}
       */
      function convert (string) {
        let converted = '';
        for (let char of string) {
          if (isNaN(Number(char))) {
            converted += convertTable[char]
          } else {
            converted += char
          }

        }
        return converted
      }

      /**
       * Calculates the MOD 97 10 of the passed IBAN as specified in ISO7064.
       *
       * @param iban
       * @returns {number}
       */
      function iso7064Mod97_10(iban) {
        let remainder = iban,
          block;

        while (remainder.length > 2){
          block = remainder.slice(0, 9);
          remainder = parseInt(block, 10) % 97 + remainder.slice(block.length);
        }

        return parseInt(remainder, 10) % 97;
      }

      function generateIban(number) {
        let clear = number.replace(/-/g, ''); // kiszedjük a '-' karaktereket
        if (clear.length === 16) clear += '00000000'; //ha kell kiegészítjük 24 számjegyre

        let modClear = clear + '173000'; //hozzáadjuk a HU00-t, a H=17, U=30 értékkel
        let validationNumber = 98 - iso7064Mod97_10(modClear); //megkapjuk az IBAN ellneörzőszámát
        return 'HU' + validationNumber + clear // visszaadjuk az IBAN-számot
      }

      function isLetter(str) {
        return str.length === 1 && str.match(/[a-z]/i);
      }
    }
  };
});
