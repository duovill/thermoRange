'use strict';

angular.module('ngIvrApp')
  .factory('Common', ['$http', '$mdDialog', function ($http, $mdDialog) {
    // Service logic
    // ...


    // Public API here
    return {

      /**
       * Elmentett pdf megnyitása
       */
      openPdf: (url) => {
        window.open(url)
      },


      /**
       * Számot szöveggé alakít
       * @param num
       * @returns {string}
       */
      numToText: function (num) {
        try {
          var int_text = '';
          var dec_text = '';
          var groups = null;
          var res = '';
          var dash = '-';
          var minus = '';

          var one = [
            'nulla',
            'egy',
            'kettő',
            'három',
            'négy',
            'öt',
            'hat',
            'hét',
            'nyolc',
            'kilenc'
          ];

          var ten = [
            ['tizen', 'tíz'],
            ['huszon', 'húsz'],
            ['harminc'],
            ['negyven'],
            ['ötven'],
            ['hatvan'],
            ['hetven'],
            ['nyolcvan'],
            ['kilencven']
          ];

          var more = [
            'száz',
            'ezer',
            'millió',
            'milliárd'
          ];

          var decimal = [
            'tized',
            'század',
            'ezred',
            'tízezred',
            'százezred'
          ];

          var translateGroup = function (group, suffix) {
            var g_res = '';

            for (var i = 0; i < 3; ++i) {
              switch (i) {
                case 0:
                  if (group.length == 3) {
                    if (group[0] != '0') {
                      if (group[0] == '1') {
                        g_res += more[0];
                      }
                      else if (group[0] == '2') {
                        g_res += 'kétszáz';
                      }
                      else {
                        g_res += one[parseInt(group[0])] + more[0];
                      }
                    }

                    group = group.substring(1);
                  }
                  break;

                case 1:
                  if (group.length > 1) {
                    if (group[0] != '0') {
                      if (group == '10') {
                        g_res += ten[0][1];
                      }
                      else if (group == '20') {
                        g_res += ten[1][1];
                      }
                      else {
                        g_res += ten[parseInt(group[0]) - 1][0];
                      }
                    }

                    group = group.substring(1);
                  }
                  break;

                default:
                  if (group[0] != '0') {
                    g_res += one[parseInt(group[0])];
                  }
                  break;
              }
            }

            return g_res + (g_res.length == 0 ? '' : suffix + dash);
          };

          if (!(num == null)) {
            num = num.toString();

            if (parseFloat(num) < 0) {
              minus = 'mínusz ';
              num = num.substring(1);
            }

            if (parseFloat(num) < 2000) {
              dash = '';
            }

            num = num.replace(/,/g, '.');
            var int = null;
            var dec = null;
            var intLen = 0;
            var decLen = 0;

            if (num.indexOf('.') > -1) {
              int = num.substr(0, num.indexOf('.'));
              dec = num.substr(num.indexOf('.') + 1);
            }
            else {
              int = num;
            }

            if (!(int == null)) {
              intLen = int.length;
            }

            if (!(dec == null)) {
              decLen = dec.length;
            }

            if (intLen) {
              if (int == '0') {
                int_text = one[0];
              }
              else {
                groups = int.split(/(?=(?:...)*$)/);

                for (var i = groups.length - 1, len = groups.length, suffix = 0; i >= 0; --i, ++suffix) {
                  if (intLen > 12) {
                    int_text = groups[i] + ' ' + int_text;
                  }
                  else {
                    int_text = translateGroup(groups[i], (suffix > 0 ? more[suffix] : '')) + int_text;
                  }
                }
              }
            }

            if (decLen) {
              one[2] = 'két';

              if (parseFloat(dec) < 2000) {
                dash = '';
              }
              else {
                dash = '-';
              }

              groups = dec.split(/(?=(?:...)*$)/);

              if (decLen <= decimal.length) {
                var suf = decimal[decLen - 1];
              }

              for (var i = groups.length - 1, len = groups.length, suffix = 0; i >= 0; --i, ++suffix) {
                if (decLen > decimal.length) {
                  dec_text = groups[i] + ' ' + dec_text;
                }
                else {
                  dec_text = translateGroup(groups[i], (suffix > 0 ? more[suffix] : '')) + dec_text;
                }
              }

              if (dec_text.indexOf('-', dec_text.length - 1) !== -1) {
                dec_text = dec_text.slice(0, -1);
              }

              if (decLen <= decimal.length) {
                dec_text += ' ' + suf;
              }

              dec_text = dec_text.replace(/^egyezer/g, 'ezer');
              dec_text = dec_text.replace(/-egyezer/g, '-ezer');
            }

            if (int_text.indexOf('-', int_text.length - 1) !== -1) {
              int_text = int_text.slice(0, -1);
            }

            res = int_text + (decLen ? ' egész ' + dec_text : '');
            res = res.replace(/^egyezer/g, 'ezer');
            res = res.replace(/-egyezer/g, '-ezer');
            res = res.replace(/-kettőezer/g, '-kétezer');
            res = res.replace(/^(kettő)(.+)/g, 'két$2');
          }

          return minus + res;
        }
        catch (err) {
        }
      },

      monthToNum: function (month) {
        switch (month) {
          case 'Január':
            return 0;
          case 'Február':
            return 1;
          case 'Március':
            return 2;
          case 'Április':
            return 3;
          case 'Május':
            return 4;
          case 'Június':
            return 5;
          case 'Július':
            return 6;
          case 'Augusztus':
            return 7;
          case 'Szeptember':
            return 8;
          case 'Október':
            return 9;
          case 'November':
            return 10;
          case 'December':
            return 11;
        }
      },

      stringToDate: function (year, month, day) {
        switch (month) {
          case 'Január':
            month = '01';
            break;
          case 'Február':
            month = '02';
            break;
          case 'Március':
            month = '03';
            break;
          case 'Április':
            month = '04';
            break;
          case 'Május':
            month = '05';
            break;
          case 'Június':
            month = '06';
            break;
          case 'Július':
            month = '07';
            break;
          case 'Augusztus':
            month = '08';
            break;
          case 'Szeptember':
            month = '09';
            break;
          case 'Október':
            month = '10';
            break;
          case 'November':
            month = '11';
            break;
          case 'December':
            month = '12';
            break;
        }

        var str = year + '-' + (month - 1) + '-' + day + '-00-00-00';
        var dt = str.split("-");
        var date = new Date(dt[0], dt[1], dt[2], dt[3], dt[4], dt[5]);

        return date;
      },

      dateToString: function (dates) {
        var date = new Date(dates);
        var year = date.getFullYear().toString();
        var day = date.getDate();
        var month = '';
        switch (date.getMonth()) {
          case 0:
            month = 'Január';
            break;
          case 1:
            month = 'Február';
            break;
          case 2:
            month = 'Március';
            break;
          case 3:
            month = 'Április';
            break;
          case 4:
            month = 'Május';
            break;
          case 5:
            month = 'Június';
            break;
          case 6:
            month = 'Július';
            break;
          case 7:
            month = 'Augusztus';
            break;
          case 8:
            month = 'Szeptember';
            break;
          case 9:
            month = 'Október';
            break;
          case 10:
            month = 'November';
            break;
          case 11:
            month = 'December';
            break;
        }
        ////console.log(year);
        ////console.log(month);
        ////console.log(date);
        return [year, month, day];
      },

      maxDay: function (year, month) {
        switch (month) {
          case 'Január':
            return 31;

          case 'Február':
            if (year % 4 === 0) {
              return 29;
            } else {
              return 28;
            }
            break;
          case 'Március':
            return 31;

          case 'Április':
            return 30;

          case 'Május':
            return 31;

          case 'Június':
            return 30;

          case 'Július':
            return 31;

          case 'Augusztus':
            return 31;

          case 'Szeptember':
            return 30;

          case 'Október':
            return 31;

          case 'November':
            return 30;

          case 'December':
            return 31;

        }
      },

      /**
       * Dátum áalakítása stringgé pl 20170502
       * @param date
       * @returns {string}
       */
      convertDate: (date) => {
        const year =  (new Date(date).getFullYear()).toString();
        const month = (new Date(date).getMonth() + 1).toString();
        const day = new Date(date).getDate().toString();
        return year + (month.length === 1 ? '0' + month : month) + (day.length === 1 ? '0' + day : day);
      },

      functiontofindIndexByKeyValue: function (arraytosearch, key, valuetosearch)
      {
          for (var i = 0; i < arraytosearch.length; i++)
          {
              if(arraytosearch[i])//ucs par helyrol undefined a tomb egyik elemet
              {
                if (arraytosearch[i][key] !== null && typeof arraytosearch[i][key] === 'object') {
                  if (JSON.stringify(arraytosearch[i][key]) === JSON.stringify(valuetosearch))
                  {
                    return i;
                  }

                } else {
                  if (arraytosearch[i][key] === valuetosearch)
                  {
                    return i;
                  }
                }

              }
          }
          return null;
      },


      autoCompleteFilter: function (source, query, limit, visibilityField, $filter) {
        if (!query) return [];
        var lowQuery = query.toLowerCase();

        return $filter('limitTo')($filter('filter')(source, function (item) {
          return item[visibilityField] & item.name.toLowerCase().indexOf(lowQuery) === 0;
        }), limit);
      },

      formatNumberLength: function (num, length) {
        var r = "" + num;
        while (r.length < length) {
          r = "0" + r;
        }
        return r;
      },

      getDispoNumber: function (dispo) {
        var counterStr = ''; // altalanos diszpo

        if (dispo.transportType == 'Hajó') {
          counterStr += 'H';
        } else if (dispo.transportType == 'Közút') {
          counterStr += 'K';
        }

        if (dispo.direction == 'in') {
          counterStr += 'I';
        } else if (dispo.direction == 'out') {
          counterStr += 'O';
        } else if (dispo.direction == 'exterior') {
          counterStr += 'E';
        }

        if (dispo.loadType == 'Berakodás'){
          counterStr += 'B';
        }else if (dispo.loadType == 'Kirakodás'){
          counterStr += 'K';
        }

        if (dispo.afterLoad == 'Zsákolás partfalra') {
          counterStr += 'ZP';
        } else if (dispo.afterLoad == 'Betárolás raktárba') {
          counterStr += 'BR';
        } else if (dispo.afterLoad == 'Kiszállítás közúton') {
          counterStr += 'KK';
        }

        if (dispo.bfkd == true) {
          counterStr += 'BFKD';
        }

        if (dispo.sygnus == true) {
          counterStr += 'S';
        }


        return $http.get('/api/counters/' + counterStr).then(function (o) {

          var r = "" + o.data.counter;
          while (r.length < 6) {
            r = "0" + r;
          }

          var dispoNumber = counterStr + '/' + r;

          return {dispo: dispo, dispoNumber: dispoNumber};
        }, function (httpError) {
          throw httpError.status + " : " + httpError.data;
        });
      },

      getContract: function (contractNumber, isOwnContractNumber, isBuy, callback) //vételi/eladási szerződés adatainak lekérése, szerződésszám alapján
      {
        var response = {};
        var query = {};
        if (isBuy) {
          query.buy = true;
        } else {
          query.buy = false;
        }

        if (isOwnContractNumber) {
          query.contractNumber = contractNumber;
        } else {
          query.partnerContractNumber = contractNumber;
        }

        $http.get('/api/contracts', {  //szerződés lekérése, a form mezőinek beállítása
          params: query
        }).then(function (contract) {
          contract = contract.data;
          if (contract instanceof Array && contract.length > 0) {
            response.productName = contract[0].product[0].name;
            response.productId = contract[0].product[0]._id;
            response.contractId = contract[0]._id;
            response.sustainability = contract[0].sustainability;
            response.parityName = contract[0].parity[0] ? contract[0].parity[0].name : "";
            if (response.parityName !== 'FOB') {
                let string = '';
                for (let i in contract[0].parityPlaces) {
                    string += contract[0].parityPlaces[i].name + (i < contract[0].parityPlaces.length - 1 ? ', ' : '')
                }
              response.parityPlace = string;
            }
            else {
              response.parityPlace = contract[0].fobDestination;
            }
            response.parity = response.parityName + ' ' + response.parityPlace;
            response.contractQuanity = contract[0].quantity;
            response.contractRemain = contract[0].remain;
            response.contractNumber = contract[0].contractNumber;
            response.reserved = contract[0].reserved;
            if (isBuy) {
              if (!contract[0].parity[0].transCostBuy) { //ha sygnus a vevő és nincs fuvardíj
                response.weigthsEqual = true; //in és out ticket lerakott súllyal megy a számlás tömbbe
              } else {
                response.weigthsEqual = false;
              }
             Object.assign(response, contract[0])
            } else {
              response.partnerContractNumber = contract[0].partnerContractNumber ? contract[0].partnerContractNumber : '-' ;
              response.partnerId = contract[0].partner[0]._id;
              response.partner = contract[0].partner[0].name;
              response.percentMinusValue = contract[0].percentMinusValue;
              response.percentPlusValue = contract[0].percentPlusValue;
              response.quantity = contract[0].quantity;

              //$scope.getItksWithProduct(contract[0].product[0]._id);
              //$scope.getSitesWithProduct(contract[0].product[0]._id);
            }
          }
          return callback(response);
        });
      },

      getSitesWithProduct: function (productId, callback) //azon saját telephelyek, ahol van az eladási szerződésben szereplő termény
      {
        var sitesWithProduct = [];
        var depotsWithProduct = [];
        //var query = {own: true, storage: true  }
        $http.get('/api/depots/' + true + '/' + true).then(function (depotList) {
          var counter = 0;
          for (var i in depotList.data) {

            for (var k in depotList.data[i].storage) {
              if (depotList.data[i].storage[k].productId === productId && depotList.data[i].storage[k].partnerId === ngivr.settings.ownFirm._id) {

                if (counter === 0) {
                  sitesWithProduct.push(depotList.data[i].site[0]);
                }
                depotsWithProduct.push(depotList.data[i]);
                counter++;
                break;
              }

            }
          }

          for (var i in depotsWithProduct) {
            for (var k = depotsWithProduct[i].storage.length - 1; k >= 0; k--) {
              if (depotsWithProduct[i].storage[k].partnerId !== ngivr.settings.ownFirm._id || depotsWithProduct[i].storage[k].productId !== productId) {
                depotsWithProduct[i].storage.splice(k, 1);
              } else {
                depotsWithProduct[i].freeToDispo = depotsWithProduct[i].storage[k].quantity;
                for (var z in depotsWithProduct[i].storage[k].dispos) {
                  depotsWithProduct[i].freeToDispo -= depotsWithProduct[i].storage[k].dispos[z].weight
                }
                depotsWithProduct[i].freeToDispo = Math.round(depotsWithProduct[i].freeToDispo * 100) / 100;
              }
            }
          }
          return callback([sitesWithProduct, depotsWithProduct]);
        });
      },

      getItksWithProduct: function (productId, callback) //azon itk-k meghatározása, amelyekben van az eladási szeződésben szereplő termény
      {
        var itkDepotsWithProduct = []; //azokat az itk-kat (a raktárakat) fogja tartalmazni, ahol van a Sygnusnak az adott terményből tárolva
        var itksWithProduct = []; //itk-s site-ok

        //var query = {own: false, storage: true  }
        $http.get('/api/depots/' + false + '/' + true).then(function (itkList) {
          var counter = 0;
          for (var i in itkList.data) //ciklus itk-kban
          {
            for (var k in itkList.data[i].storage) //ciklus az itk storage tömbjében
            {
              if (itkList.data[i].storage[k].productId === productId && itkList.data[i].storage[k].partnerId === ngivr.settings.ownFirm._id) //ha az adott tömbben van a keresett terményből és a partner a Sygnus
              {
                if (counter === 0) {
                  itksWithProduct.push(itkList.data[i].site[0]);

                  itksWithProduct[itksWithProduct.length - 1].quantity = itkList.data[i].storage[k].quantity;
                  for (var z in itkList.data[i].storage[k].dispos) {
                    itksWithProduct[itksWithProduct.length - 1].quantity -= itkList.data[i].storage[k].dispos[z].weight
                  }
                }
                itkDepotsWithProduct.push(itkList.data[i]); //berakjuk az itk-t a tömmbe
                counter++;
                break;
              }
            }
          }
          for (var i in itkDepotsWithProduct) //ciklus a tömbben
          {
            for (var k = itkDepotsWithProduct[i].storage.length - 1; k >= 0; k--) //ciklus az adott itk storage tömbjében
            {
              if (itkDepotsWithProduct[i].storage[k].partnerId !== ngivr.settings.ownFirm._id || itkDepotsWithProduct[i].storage[k].productId !== productId) //ha nem Sygnus a partner, vagy nem a keresett termény van a storage adott elemében
              {
                itkDepotsWithProduct[i].storage.splice(k, 1); //töröljük az elemet
              }
            }
          }
          return callback(itksWithProduct)
        });

      },


      findValue: function (o, value) //azt vizsgálja, adott objektumnak van-e property-je a megadott értékkel, ha van a property-t adja vissza, ha nincs akkor null-t
      {
        for (var prop in o) {
          if (o.hasOwnProperty(prop) && o[prop] === value) {
            return prop;
          }
        }
        return null;
      },

      /**
       * Ellenőrzi, hogy adott objektum iterálható-e
       * @param obj
       * @returns {boolean}
       */
      isIterable: function (obj) {
      // checks for null and undefined
      if (obj == null) {
        return false;
      }
      return typeof obj[Symbol.iterator] === 'function';
    },

    checkPartner: function (partner, notNeedConto) {
        //if (partner.type1 === 'áthozott' || partner.type2 === 'áthozott') { // csak az áthozott partnert kell ellenőrizni
        const generalFields = [
            {name: 'type1', condition: 'forbidden'},
            {name: 'type2', condition: 'forbidden'},
            {name: 'partnerGroup', condition: 'exists'},
            {name: 'status', condition: 'hasLength'},
            {name: 'name', condition: 'exists'},
            //{name: 'shortName', condition: 'exists'},
            {name: 'vatNumbers', condition: 'hasLength'},
            {name: 'currency', condition: 'exists'},
            {name: 'kata', condition: 'exists'},
            {name: 'cashAccounting', condition: 'exists'},


        ];
        if (!notNeedConto) {
            generalFields.push({name: 'conto', condition: 'hasLength'})
        }
        let farmerFields = [];

        if (partner.type2 === 'Őstermelő') {
            farmerFields = [
                {name: 'producerId', condition: 'exists'},
                {name: 'vatId', condition: 'exists'},
                {name: 'taj', condition: 'exists'},
                {name: 'gender', condition: 'exists'},
                {name: 'birthName', condition: 'exists'},
                {name: 'birthPlace', condition: 'exists'},
                {name: 'birthDate', condition: 'exists'},
                {name: 'motherName', condition: 'exists'},

            ]
        }
        let partnerFields = generalFields.concat(farmerFields);
        if (partner.type1 === 'áthozott' || partner.type2 === 'áthozott' || partner.type2 === 'Cég') {
            partnerFields.push({name: 'shortName', condition: 'exists'})
        }
        let wrongFields = [];
        for (let field of partnerFields) {
            switch (field.condition) {
                case 'forbidden':
                    if (partner[field.name] === 'áthozott') {
                        wrongFields.push(ngivr.strings.partner.field[field.name] || ngivr.strings.field[field.name])
                    }
                    break
                case 'exists':
                    if (partner[field.name] === undefined) {
                        wrongFields.push(ngivr.strings.partner.field[field.name] || ngivr.strings.field[field.name])
                    }
                    break;
                case 'hasLength':
                    if (!partner[field.name].length) {
                        wrongFields.push(ngivr.strings.partner.field[field.name] || ngivr.strings.field[field.name])
                    }
            }

        }

        if (wrongFields.length === 1 && wrongFields[0] === ngivr.strings.partner.field.conto) wrongFields = []
        return wrongFields
    },

    showWrongFieldsPopup : function (wrongFields) {
        $mdDialog.show({
            controller: function ($scope, $mdDialog, wrongFields) {
                $scope.wrongFields = wrongFields;

                $scope.cancel = function () {
                    $mdDialog.cancel();
                }

            },
            locals: {
                wrongFields: wrongFields
            },
            template: `<md-dialog aria-label="">
  
                                              <md-toolbar>
                                                  <div class="md-toolbar-tools portlet-title">
                                                    <h2>Hiányos partner adatok</h2>
                                                    <span flex></span>
                                                    <md-button class="md-icon-button" ng-click="cancel()">
                                                      <md-icon class="fa fa-close" aria-label="Close dialog"></md-icon>
                                                    </md-button>
                                                  </div>
                                              </md-toolbar>
                                            
                                              <md-dialog-content style="margin: 6px">
                                                <div style="margin-bottom: 6px">
                                                    A partner módosítható a Partner adatok szerkesztése gombbal.<br>Az alábbi adatok beállítása szükséges:
                                                
                                                
                                                    <div ng-repeat="field in wrongFields" style="margin-left: 6px; margin-top: 6px">
                                                        - {{field}}
                                                    </div>
                                                </div>                                 
                                                A Partner adatok szerkesztése gomb melletti Info ikon is megmutatja a fenti mezőket.                                                
                                              </md-dialog-content>
                                              <md-dialog-actions >                                                  
                                                <ngivr-button ng-click="cancel()">   
                                                    Rendben
                                                </ngivr-button>
                                              </md-dialog-actions>
                                        </md-dialog>`,
            parent: angular.element(document.body),
            //targetEvent: ev,
            clickOutsideToClose: true,
            fullscreen: false // Only for -xs, -sm breakpoints.
        })
            .then(function (answer) {
                $scope.status = 'You said the information was "' + answer + '".';
            }, function () {
                $scope.status = 'You cancelled the dialog.';
            });

        return
    }

      /**
       * Sorszám kiosztása
       */
    //   setNumber : async (type) => {
    //   let year = new Date().getFullYear().toString().slice(-2); //évszám a sorszámban
    //   if (year > 17) {
    //     let response = await $http.get('/api/counters/' + type + '_' + year);
    //     return type + year + '/' + Common.formatNumberLength(response.data.counter, 5);
    //   } else {
    //     let response;
    //     if (type === 'SBD') {
    //       response = await $http.get('/api/counters/ownDispoIn');
    //     } else if (type === 'SKD') {
    //       response = await $http.get('/api/counters/ownDispoOut');
    //     } else {
    //       response = await $http.get('/api/counters/' + type);
    //     }
    //
    //     return type + year + '/' + this.formatNumberLength(response.data.counter, 5);
    //   }
    //
    //
    // }

      //assign: function (dst, src) {
      //  if( (typeof src === 'undefined') || (src === null) || (src === []) ){
      //    //console.log(" Assignment source is undefined, null, or empty array.");
      //  }else {
      //    dst = src; //JSON.parse(JSON.stringify(src));
      //  }
      //}

    };
  }]);
