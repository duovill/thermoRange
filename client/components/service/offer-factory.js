'use strict';

angular.module('ngIvrApp')
  .factory("OfferFactory", ['Common', 'ngivrGrowl', '$filter', 'syncedCache', 'Auth', '$http', '$state', function (Common, ngivrGrowl, $filter, syncedCache, Auth, $http, $state) {

    return {

      /**
       * contract dokumentum mentése
       * @param operation
       * @param scope
       */
      saveContract : async function (operation, scope) {


          if (scope.newContract.isNewPartner && scope.newContract.newPartner[0].conto.length && scope.newContract.newPartner[0].conto[0].number === '') {
              scope.newContract.newPartner[0].conto = [];
          }

          scope.isDisabled = true; //inaktívvá tesszük a form gombjait (mentés, sablon mentés, beküldés, törlés)

        ////////////////////////
        // dátumok beállítása //
        ////////////////////////
        this.setFromDate(scope);
        this.setToDate(scope);
        this.setUniqContractDate(scope);
        this.setCarryDate(scope);
        this.setBeforeDate(scope);
        this.setDepositDate(scope);
        this.setDeferredPricingDate(scope);

        /*if (operation === 'submit' || (operation === 'save' && (scope.newContract.submitted || scope.newContract.returned))) {
          //dátumok ellenőrzése
          this.checkTransportDates(scope);
          //this.checkDepositDate(scope); // TODO pontosítani a validációt
          //this.checkDeferredPricingDate(scope); // TODO pontosítani a validációt
          //this.checkBeforeTransportDate(scope); // TODO pontosítani a validációt

          if (scope.badDate || scope.badFromDate || scope.badDepositDate || scope.badDeferredPricingDate || scope.badBeforeDate) {
            return;
          }
        }*/

        if (scope.newContract.isNewPartner) {
          if (scope.newContract.newPartner[0].address.country.code !== 'HU') {
            scope.newContract.newPartner[0].address.zipCode.settlement = $scope.newContract.newPartner[0].address.city;
          }
          scope.newContract.newPartner[0].postalAddressIsSame = true;
          scope.newContract.newPartner[0].postAddress = angular.copy(scope.newContract.newPartner[0].address);
        }

        if (scope.newContract.isNewPartner) { //ha új partner
          scope.newContract.partner[0] = null;
          scope.newContract.withoutPartner = false

        } else if (!scope.newContract.isNewPartner && scope.newContract.newPartner[0] !== null) { //ha meglévő partner
          scope.newContract.newPartner.splice(0, 1);
        }
        if (scope.newContract.parity[0] !== null) {
          /*for (var i = 0; i < syncedCache.parities.length; i++) { //ciklussal megkeressük a formba írt paritást a paritás tömbben és megjegyezzük az index-ét
            if (syncedCache.parities[i]._id === scope.newContract.parity[0]._id) {
              scope.newContract.parity[0] = syncedCache.parities[i];
              break;
            }
          }*/
          if(scope.newContract.parity[0] !== undefined) {
              if (scope.newContract.parity[0].river) {
                  scope.newContract.parityPlace = '';
                  scope.newContract.parityPlaces = [];
                  scope.newContract.loadCity = '';
                  scope.newContract.unloadCity = '';
                  scope.newContract.toSite = false;
              } else {
                  scope.newContract.fobDestination = '';
              }
          }
        }
        //ok
////////////////////////////////////////////
        //nem ok
        if (scope.newContract.product[0] !== null) {
          scope.newContract.product[0] = (_.filter(syncedCache.products, {_id: scope.newContract.product[0]._id}))[0];
          /*if (scope.newContract.uniqueQuality.length != 0) { //ha van egyedi min. paraméter
            for (var i in scope.newContract.uniqueQuality) { //ciklus az egyedi par. között
              for (let z in scope.newContract.product[0].qualityParams) { //ciklus a termény normál paramétereiben
                if (scope.newContract.uniqueQuality[i].name === scope.newContract.product[0].qualityParams[z].name) { //ha az egyedi neve egyezik a normáléval
                  scope.newContract.product[0].qualityParams[z].value = scope.newContract.uniqueQuality[i].value; //beírjuk az egyedit a normál helyére
                }
              }
            }
          }*/
        }
//nem ok
///////////////
        //ok
        if (!scope.newContract.normal) { //ha opciós ügylet
          if (scope.newContract.price !== null) {
            scope.newContract.price = null;
          }
          scope.newContract.optionUniqueQuality = [];
          scope.newContract.optionProducts = [];
          for (var i in scope.newContract.optionItems) { //ciklus az opciós tételekben
            for (let p in syncedCache.optionProducts) { //ciklus a terményekben
              if (scope.newContract.optionItems[i].product == syncedCache.optionProducts[p].name) { //ha az opciós termény neve egyezik a termény tömb név elemével
                var optprodindex = p; //meg van az opciós terményindex
                break;
              }
            }
            scope.newContract.optionProducts.push(syncedCache.optionProducts[optprodindex]); //berakjuk a terménydokumentumot az opciós tétel terménytömbjébe
            if (scope.newContract.optionItems[i].optionQualitys.length != 0) { //ha az opciós tétel egyedi minőséget tartalmaz
              scope.newContract.optionUniqueQuality.push(scope.newContract.optionItems[i].optionQualitys);
              /*for (let uq in scope.newContract.optionItems[i].optionQualitys) { //ciklus az egyedi paraméterek között
                for (let nq in scope.newContract.optionProducts[i].qualityParams) { //ciklus a termény normál paramétereiben
                  if (scope.newContract.optionItems[i].optionQualitys[uq].name === scope.newContract.optionProducts[i].qualityParams[nq].name) { //ha az egyedi neve egyezik a normáléval
                    scope.newContract.optionProducts[i].qualityParams[nq].value = scope.newContract.optionItems[i].optionQualitys[uq].value; //beírjuk az egyedit a normál helyére
                  }
                }
              }*/
            }
          }
        }
        //nem ok
///////////////
        //ok
        if (scope.newContract.percent == false) { // +-%
          scope.newContract.percentPlusValue = null;
          scope.newContract.percentMinusValue = null;
        }

        /*if (operation !== 'delete') {
          if (!this.checkUniqueContractDate(scope) || !this.checkCarry(scope) ){
            scope.badUniqeContractDate = true;
            scope.isDisabled = false;
            scope.newContract.submitted = false;
            return;
          }
        }*/

        if (!scope.newContract.broker) {
          scope.newContract.brokerCurrency = null;
          scope.newContract.brokerName = '';
          scope.newContract.brokerPrice = null;
        }

        if (!scope.newContract.dealer) {
          scope.newContract.dealerCurrency = null;
          scope.newContract.dealerName = '';
          scope.newContract.dealerPrice = null;
        }

        if (scope.newContract.buy) {
          scope.newContract.commercial = '';
          scope.newContract.sampleStandard = '';
          scope.newContract.gmp = false;
          scope.newContract.extension = false;
          // scope.newContract.uniquePayDate = false;
          // scope.newContract.uniquePayDays = null;
          // scope.newContract.uniquePayDayType = '';
        }

        if (!scope.newContract.transportCost) {
          scope.newContract.transportCostPrice = null;
          scope.newContract.transportCostUnit = '';

        }

        if (!scope.newContract.isQualityControlPrice) {
          scope.newContract.qualityControlPrice = null;
          scope.newContract.qualityControlPriceUnit = '';
        }


        if (!scope.newContract.normal) {
          scope.newContract.sumPrice = scope.newContract.quantity * scope.newContract.optionAvgPrice;
        }

        scope.newContract.remain = scope.newContract.quantity; //szállításból visszalévő menyiség

        // ok
        ////////////////////////

        switch (operation) {
          case 'save':
            if (!scope.newContract.submitted && !scope.newContract.returned && !scope.newContract.saved) {
              this.postOffer(scope.newContract, operation, true, false, false, false, false, true, false).then(function () {
                scope.newContract = (JSON.parse(JSON.stringify(scope.default))); //newContract feltöltése alapértékekkel
                scope.beforeDate = []; //dátumtömbök nullázása
                scope.termFrom = [];
                scope.termTo = [];
                scope.deposit = [];
                scope.pricing = [];
                scope.carryDate = [];
                scope.newcontract.$setPristine();
                ngivrGrowl('Ajánlat mentve');
                $state.go('myOffers');
              })
            } else if (scope.newContract.saved) {
              this.updateOffer(scope.newContract, operation, null, true,false, false, false, false, true, false ).then(function () {
                scope.beforeDate = []; //dátumtömbök nullázása
                scope.termFrom = [];
                scope.termTo = [];
                scope.deposit = [];
                scope.pricing = [];
                scope.carryDate = [];
                ngivrGrowl('Módosított ajánlat mentve');
                $state.go('myOffers');
              })
            } else {
              ngivrGrowl('Beküldött ajánlat szerkesztés után a Beküldés gombbal menthető.')
            }

            break;
          case 'template':
            this.postOffer(scope.newContract, operation, false, false, false, false, true, false, false).then(function () {
              scope.isDisabled = false;
              ngivrGrowl('Sablon mentve')
            });
            break;
          case 'delete':
            if (scope.newContract.hasOwnProperty('_id') && !scope.newContract.template) {
              $http.put('/api/contracts/' + scope.newContract._id, {deletedOffer: true}).then(function () {
                ngivrGrowl('Ajánlat törölve');
                $state.go('myOffers');
              })

            } else {
              scope.newContract = (JSON.parse(JSON.stringify(scope.default))); //newContract feltöltése alapértékekkel
              scope.beforeDate = []; //dátumtömbök nullázása
              scope.termFrom = [];
              scope.termTo = [];
              scope.deposit = [];
              scope.pricing = [];
              scope.carryDate = [];
              scope.newcontract.$setPristine();
              scope.isDisabled = false;
              //$state.go('myOffers');
            }

            break;
          case 'submit':
            if (!scope.newContract.hedgeType) {
              scope.newContract.hedgeType = 'normal';
            }
            scope.newContract.dateOfSubmit = new Date();

            const postOffer = this.postOffer;
            const updateOffer = this.updateOffer;
            if (!scope.newContract.submitted && !scope.newContract.returned && !scope.newContract.saved){ //teljesen új ajánlat beküldése
              let contractName = await this.setNumber(Auth.getCurrentUserId());
              //$http.get('/api/counters/' + Auth.getCurrentUserId()).then(function (number) { //új ajánlathoz kérünk sorszámot, majd mentjük
                scope.newContract.contractName = Auth.getCurrentUser().nickName + ' AJ' + contractName;
                //scope.newContract.newEventsByOwner++;
                postOffer(scope.newContract, operation, false, true, false, false, false, true, false).then(function (response) {
                  $http.post('api/newNotifications', {
                    contractId: response._id,
                    contractNumber: response.contractName,
                    message: 'Új ajánlat',
                    messageDate: new Date(),
                    to: scope.logisticsIds,
                    url: 'newContract/offerDetails/' + response._id,
                    state: 'newContract.offerDetails'
                  });
                  ngivrGrowl('Ajánlat beküldve');
                  $state.go('myOffers');
                })

              //})


            } else if (scope.newContract.saved && !scope.newContract.returned) { //korábban mentett ajánlat beküldése
              let contractName = await this.setNumber(Auth.getCurrentUserId());
             // $http.get('/api/counters/' + Auth.getCurrentUserId()).then(function (number) { //új ajánlathoz kérünk sorszámot, majd mentjük
                scope.newContract.contractName = Auth.getCurrentUser().nickName + ' AJ' + contractName;
                updateOffer(scope.newContract, operation, 'Beküldve', false, true, false, false, false, true, false).then(function (response) {
                  $http.post('api/newNotifications', {
                    contractId: response._id,
                    contractNumber: response.contractName,
                    message: 'Új ajánlat',
                    messageDate: new Date(),
                    to: scope.logisticsIds,
                    url: 'newContract/offerDetails/' + response._id,
                    state: 'newContract.offerDetails'
                  });
                  ngivrGrowl('Ajánlat beküldve');
                  $state.go('myOffers');
                })
              //})
            } else { //visszaküldött ajánlat, vagy csak szerkesztett ajánlat beküldése
              updateOffer(scope.newContract, operation, 'Szerkesztve', false, true, false, false, false, true, false).then(function (response) {
                $http.post('api/newNotifications', {
                  contractId: response._id,
                  contractNumber: response.contractName,
                  message: 'Szerkesztett ajánlat',
                  messageDate: new Date(),
                  to: scope.logisticsIds,
                  url: 'newContract/offerDetails/' + response._id,
                  state: 'newContract.offerDetails'
                });
                ngivrGrowl('Ajánlat beküldve');
                $state.go('myOffers');
              })
            }

            break;
        }


      },

      /**
       * Ajánlat frissítése
       * @param contract
       * @param operation
       * @param event
       * @param isSaved
       * @param isSubmitted
       * @param isDeleted
       * @param isReturned
       * @param isTemplate
       * @param isOffer
       * @param isContract
       * @returns {*}
       */
      updateOffer : function (contract, operation, event, isSaved, isSubmitted, isDeleted, isReturned, isTemplate, isOffer, isContract) {
        let object = angular.copy(contract);
        object.saved = isSaved;
        object.submitted = isSubmitted;
        object.deletedOffer = isDeleted;
        object.returned = isReturned;
        object.template = isTemplate;
        object.offer = isOffer;
        object.contract = isContract;
        if (event !== null) {
          const currentDate = new Date();
          const currentUser = Auth.getCurrentUser();
          object.history.push({
            date: currentDate,
            by: currentUser.fullName,
            event: event
          });
          object.newEventsByOwner++;
        }
        let promise;
        if (!promise) {
          promise = $http.put('/api/contracts/' + object._id, object).then(function (response) {
            return response.data;
          });
        }
        return promise;
      },

      /**
       * Új ajánlat létrehozása
       * @param contract
       * @param operation
       * @param isSaved
       * @param isSubmitted
       * @param isDeleted
       * @param isReturned
       * @param isTemplate
       * @param isOffer
       * @param isContract
       * @returns {*}
       */
      postOffer : function (contract, operation, isSaved, isSubmitted, isDeleted, isReturned, isTemplate, isOffer, isContract) {
        let object = angular.copy(contract);
        if (object.template) {
          delete object._id;
          delete object.createdAt;
          delete object.updatedAt;
          delete object.__v;
        }
        object.saved = isSaved;
        object.submitted = isSubmitted;
        object.deletedOffer = isDeleted;
        object.returned = isReturned;
        object.template = isTemplate;
        object.offer = isOffer;
        object.contract = isContract;
        const currentUser = Auth.getCurrentUser();
        object.owner.push({
          nickName: currentUser.nickName,
          fullName: currentUser.fullName,
          name: currentUser.name,
          id: currentUser._id
        });
        if (operation === 'submit') {

          const currentDate = new Date();
          object.history.push({
            date: currentDate,
            by: currentUser.fullName,
            event: 'Beküldve'
          });
          object.newEventsByOwner++;
        }
        let promise;
        if (!promise) {
          promise = $http.post('/api/contracts', object).then(function (response) {

            return response.data;
          });
        }
        return promise
      },

      /**
       * Megállapodási dátum módosításának megakadályozása
       * @param scope
       * @param val
       * @returns {boolean}
       */
      preventChange : function(scope, val) {
        if(scope.submitted || scope.returned) {
          return scope.uniqueContracting !== val;
        }
        return false;
      },

      /**
       * Megállapodási dátum móosítása
       * @param scope
       * @param uniqContract
       * @returns {*}
       */
      uniqueContractingChanged: function(scope, uniqContract) {
        if (typeof scope.uniqueContracting == 'undefined') {
          scope.uniqueContracting = false;
        }
        if (!scope.uniqueContracting && !scope.submitted && !scope.returned) {
          scope.uniqueContractDate = new Date();
          if (typeof uniqContract === 'undefined') {
            uniqContract = new Array(3);
          }
          if (scope.uniqueContractDate !== null) {
            uniqContract = Common.dateToString(scope.uniqueContractDate);
          } else {
            uniqContract = new Array(3);
          }
        }
        return uniqContract;
      },

      /**
       * Ajánlat dátumának ellenőrzése TODO úgy tűnik szükségtelen
       * @param scope
       * @returns {boolean}
       */
      validateUniqDate:function (scope){

        if(!scope.newContract.submitted && !scope.returned) {
          if (typeof scope.uniqContract[0] !== 'undefined') {
            const temp = Common.stringToDate(scope.uniqContract[0],
              scope.uniqContract[1], scope.uniqContract[2]); //hat.idő -tól
            const twoDaysBeforeToday = new Date();
            twoDaysBeforeToday.setDate(twoDaysBeforeToday.getDate() - 2);
            if (temp < twoDaysBeforeToday) {
              scope.badCarryMsg = 'A szerződés dátum régebbi, mint a mai dátum - 2 nap!';
              ngivrGrowl(scope.newContract.badCarryMsg);
              return false;
            }
          }
        }
        return true;
      },

      /**
       * Szállítás kező dátuma
       * @param scope
       */
      setFromDate: function (scope) {
        if (typeof scope.termFrom[0] != 'undefined') {
          scope.newContract.termFrom = Common.stringToDate(scope.termFrom[0], scope.termFrom[1], scope.termFrom[2]); //hat.idő -tól
        } else {
          scope.newContract.termFrom = null;
        }
      },

      /**
       * Szállítás befejező dátuma
       * @param scope
       */
      setToDate: function (scope) {
        if (typeof scope.termTo[0] != 'undefined') {
          scope.newContract.termTo = Common.stringToDate(scope.termTo[0], scope.termTo[1], scope.termTo[2]); //hat.idő -ig
        } else {
          scope.newContract.termTo = null;
        }
      },

      /**
       * Előre fizetés dátuma
       * @param scope
       */
      setBeforeDate: function (scope) {
        if (scope.newContract.prePaid && scope.beforeDate.length != 0) { //ha előrefizetéses az ügylet
          for (let i in scope.newContract.beforeTransportDetails) { //előrefizetés
            if (!scope.newContract.beforeTransportDetails.beforeTransport) {
              scope.newContract.beforeTransportDetails[i].date = Common.stringToDate(scope.beforeDate[i].year,
                scope.beforeDate[i].month,
                scope.beforeDate[i].day);
            } else {
              scope.newContract.beforeTransportDetails[i].date = null;
            }
          }
        } else {
          scope.newContract.beforeTransportDetails = [];
        }
      },

      /**
       * Előleg dátuma
       * @param scope
       */
      setDepositDate: function (scope) {
        if (scope.newContract.deposit && typeof scope.deposit[0] != 'undefined') {  //ha van előleg és dátum is
          scope.newContract.depositDate = Common.stringToDate(scope.deposit[0], scope.deposit[1], scope.deposit[2]); //előleg dátuma
        } else {  //ha nincs előleg
          scope.newContract.depositDate = null;
          scope.newContract.depositSum = null;
        }
      },

      /**
       * Halasztott árazás dátuma
       * @param scope
       */
      setDeferredPricingDate: function (scope) {
        if (!scope.newContract.normalPricing && typeof scope.pricing[0] != 'undefined') { //halasztott árazás esetén
          scope.newContract.pricingDate = Common.stringToDate(scope.pricing[0], scope.pricing[1], scope.pricing[2]); //árazás dátuma
        } else {
          scope.newContract.pricingDate = null;
        }
      },

      /**
       * Carry dátum átalakítása betöltéskor
       * @param scope
       */
      getCarryDate:function (scope){
        scope.carryDate = [];
        for (let i = 0; i < scope.newContract.carryData.length; i++) {
          const tempDate = Common.dateToString(scope.newContract.carryData[i].baseDate);
          scope.carryDate.push({
            year: tempDate[0],
            month: tempDate[1],
            day: '1'
          });
        }
      },

      /**
       * Carry dátuma
       * @param scope
       */
      setCarryDate:function (scope){
        if (scope.newContract.carry) {
          if (typeof scope.carryDate !== 'undefined') {
            if (scope.carryDate.length !== 0) {
              for (let i = scope.carryDate.length - 1; i >= 0; i--) {
                if (typeof scope.carryDate[i] !== 'undefined' && !(scope.carryDate[i].year === null || scope.carryDate[i].month === null)) {
                  scope.newContract.carryData[i].baseDate = Common.stringToDate(scope.carryDate[i].year,
                    scope.carryDate[i].month, 1);
                }
                else {
                  scope.newContract.carryData.splice(i, 1);
                }
              }
            }
          }
        } else {
          scope.newContract.carryData = [];
        }
      },

      /**
       * Megállapodás dátuma
       * @param scope
       */
      setUniqContractDate:function (scope){
          let contractDate = Common.stringToDate(scope.uniqContract[0], scope.uniqContract[1], scope.uniqContract[2]);
        if (typeof scope.uniqContract[0] !== 'undefined' && scope.newContract.uniqueContracting) {
          scope.newContract.uniqueContractDate = contractDate

        } else {
          scope.newContract.uniqueContractDate = null;
        }
          scope.newContract.contractDate = $filter('date')(contractDate, "yyyy.MM.dd");
      },

      /**
       * Megállapodás dátumának beállítása betöltéskor
       * @param scope
       */
      getUniqContractDate: function (scope)
      {
        if(typeof scope.uniqContract === 'undefined')
        {
          scope.uniqContract = new Array(3);
        }
        if(scope.newContract.uniqueContractDate !== null) {
          scope.uniqContract = Common.dateToString(scope.newContract.uniqueContractDate);
        }else {
          const temp = new Date();
          scope.uniqContract = Common.dateToString(temp);
        }
      },

      /**
       * Szállítási dátumok elenőrzése
       * @param scope
       */
      checkTransportDates: function (scope) {
        const d = new Date();
        d.setDate(d.getDate() - 31);
        if (scope.newContract.termFrom < d) {
          console.log('rossz dátum');
          if (!scope.isNewPartner && typeof scope.newContract.partner[0] != 'undefined') {
            scope.contractPartner = {
              name: scope.newContract.partner[0].name,
              vatNumber: scope.newContract.partner[0].vatNumber,
              address: scope.newContract.partner[0].address
            };
          }
          scope.badFromDate = true;
          scope.isDisabled = false;
          //return;
        } else {
          scope.badFromDate = false;
        }
        if (scope.newContract.termTo < scope.newContract.termFrom) {
          console.log('rossz dátum');
          if (!scope.isNewPartner && typeof scope.newContract.partner[0] != 'undefined') {
            scope.contractPartner = {
              name: scope.newContract.partner[0].name,
              vatNumber: scope.newContract.partner[0].vatNumber,
              address: scope.newContract.partner[0].address
            };
          }
          scope.badDate = true;
          scope.isDisabled = false;
          //return;
        } else {
          scope.badDate = false;
        }
      },

      checkDepositDate: function (scope) {
        if (scope.deposit) {
          scope.badDepositDate = scope.newContract.depositDate > scope.newContract.termTo;
        } else {
          scope.badDepositDate = false
        }
      },

      checkDeferredPricingDate: function (scope) {
        if (!scope.normalPricing) {
          scope.badDeferredPricingDate = scope.newContract.pricingDate > scope.newContract.termTo;
        } else {
          scope.badDeferredPricingDate = false
        }
      },

      checkBeforeTransportDate: function (scope) {
        if (scope.newContract.prePaid) {
          for (let i in scope.newContract.beforeTransportDetails) {
            if (i === 0) {
              scope.badBeforeDate = scope.newContract.beforeTransportDetails[i].date < scope.newContract.termFrom || scope.newContract.beforeTransportDetails[i].date > scope.newContract.termTo;
            } else if (i !== scope.newContract.beforeTransportDetails.length - 1){
              scope.badBeforeDate = scope.newContract.beforeTransportDetails[i].date < scope.newContract.beforeTransportDetails[i - 1].date;
            } else {
              scope.badBeforeDate = scope.newContract.beforeTransportDetails[i].date < scope.newContract.beforeTransportDetails[i - 1].date || scope.newContract.beforeTransportDetails[i].date > scope.newContract.termTo;
            }
          }
        } else {
          scope.badBeforeDate = false;
        }
      },

      /**
       * Megállapodás dátumának ellenőrzése
       * @param scope
       * @returns {boolean}
       */
      checkUniqueContractDate: function (scope) {
        if(!scope.newContract.submitted && !scope.newContract.returned) {
          if (typeof scope.uniqContract[0] !== 'undefined') {
            const temp = Common.stringToDate(scope.uniqContract[0],
              scope.uniqContract[1], scope.uniqContract[2]); //hat.idő -tól
            const twoDaysBeforeToday = new Date();
            twoDaysBeforeToday.setDate(twoDaysBeforeToday.getDate() - 2);
            if (temp < twoDaysBeforeToday) {
              scope.badCarryMsg = 'A szerződés dátum régebbi, mint a mai dátum - 2 nap!';
              ngivrGrowl(scope.badCarryMsg);
              return false;
            }
          }
          if (Common.stringToDate(scope.uniqContract[0], scope.uniqContract[1], scope.uniqContract[2]) > new Date()  ) {
            scope.badUniqueMsg = "A megállapodás dátuma nem lehet a mai napnál későbbi!";
            ngivrGrowl(scope.badUniqueMsg);
            return false;
          }
        }
        if (scope.newContract.uniqueContracting) {
          if (scope.uniqContract.some(function (el) {
              return el === null
            })  )  {
            scope.badUniqueMsg = "Minden dátum mezőt ki kell tölteni a egyedi dátum esetén";
            ngivrGrowl(scope.badUniqueMsg);
            return false;
          }
        }
        return true;
      },

      /**
       * Carry dátum ellenőrzése
       * @param scope
       * @returns {boolean}
       */
      checkCarry: function (scope) {
        if (typeof scope.carryDate !== 'undefined') {
          if (scope.carryDate.length !== 0) {
            scope.newContract.badCarryMsg = '';
            scope.badCarryDate = false;
            let prev = Common.stringToDate(scope.carryDate[0].year,
              scope.carryDate[0].month, 1);
            for (let i = 0; i < scope.newContract.carryData.length; i++) {
              if (typeof scope.carryDate[i] !== 'undefined') {
                scope.newContract.carryData[i].baseDate = Common.stringToDate(scope.carryDate[i].year,
                  scope.carryDate[i].month, 1);
                /**
                 * ha korábbi a basedate éve, mint a from, akkor hiba
                 * ha egyezik a két év, és a hónap korábbi, akkor hiba
                 */
                if (scope.newContract.termFrom.getFullYear() > scope.newContract.carryData[i].baseDate.getFullYear()) {
                  scope.badCarryMsg = 'A Carry-ben hibás dátum van! A dátum korábbi, mint a szállítási határidő kezdete!';
                  ngivrGrowl(scope.badCarryMsg);
                  return false;
                }
                if (scope.newContract.termFrom.getFullYear() === scope.newContract.carryData[i].baseDate.getFullYear() &&
                  scope.newContract.termFrom.getMonth() > scope.newContract.carryData[i].baseDate.getMonth()) {
                  scope.badCarryMsg = 'A Carry-ben hibás dátum van! A dátum korábbi, mint a szállítási határidő kezdete!';
                  ngivrGrowl(scope.badCarryMsg);
                  return false;
                }
                if (scope.newContract.termTo.getFullYear() < scope.newContract.carryData[i].baseDate.getFullYear() ) {
                  scope.newContract.badCarryMsg = 'A Carry-ben hibás dátum van! A dátum későbbi, mint a szállítási határidő vége!';
                  ngivrGrowl(scope.newContract.badCarryMsg);
                  return false;
                }
                if (scope.newContract.termTo.getFullYear() === scope.newContract.carryData[i].baseDate.getFullYear() &&
                  scope.newContract.termTo.getMonth() < scope.newContract.carryData[i].baseDate.getMonth()) {
                  scope.newContract.badCarryMsg = 'A Carry-ben hibás dátum van! A dátum későbbi, mint a szállítási határidő vége!';
                  ngivrGrowl(scope.newContract.badCarryMsg);
                  return false;
                }

              }
              if (scope.newContract.carryData[i].price > scope.newContract.price * 1.05) {

                scope.newContract.badCarryMsg = 'A Carry-ben hibás ár van! A carry ár nagyobb, mint a termény árának 5%-a';
                ngivrGrowl(scope.newContract.badCarryMsg);

                return false;
              }
              if (i != 0) {
                if (prev >= scope.newContract.carryData[i].baseDate) {

                  scope.newContract.badCarryMsg = 'A Carry-ben hibás dátum van! Az előző dátum nagyobb, vagy egyenlő mint a következő!';
                  ngivrGrowl(scope.newContract.badCarryMsg);
                  scope.badCarryDate = true;
                  scope.isDisabled = false;
                  return false;
                }
                prev = Common.stringToDate(scope.carryDate[i].year,
                  scope.carryDate[i].month, 1);
              }
            }
          }
        }
        return true;
      },

      /**
       * Sorszám kiosztása
       */
      setNumber : async (type) => {
        let year = new Date().getFullYear().toString().slice(-2); //évszám a sorszámban
        if (year > 17) {
          let response = await $http.get('/api/counters/' + type + '_' + year);
          return Common.formatNumberLength(response.data.counter, 3) + '/' + year;
        } else {
          let response;
          if (type === 'SBD') {
            response = await $http.get('/api/counters/ownDispoIn');
          } else if (type === 'SKD') {
            response = await $http.get('/api/counters/ownDispoOut');
          } else {
            response = await $http.get('/api/counters/' + type);
          }

          return Common.formatNumberLength(response.data.counter, 3);
        }


      },


    };
  }]);
