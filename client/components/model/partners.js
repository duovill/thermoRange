'use strict';
ngivr.model.partner = class {
  constructor() {

    this.currency = undefined
    ;
    this.kata = false;
    this.cashAccounting = false;
    this.name = undefined;
    this.type1 =  'Gabonapartner';
    this.type2 = 'Cég';
    this.broker = false;
    this.vatNumbers = [{
      number: '',
      vatNumberType: 'HU' // adószám típusa
    }];
    this.address = undefined;
    this.conto = [{isIban: false, number: undefined, default: true}];
    this.vatId = undefined;
    this.taj = undefined;
    this.reg = undefined;
    this.birthDate = undefined;
    this.birthPlace = undefined;
    this.motherName = undefined;
    this.mails = [{
      name: undefined,
      email: undefined,
      type: 'Kereskedő'
    }];
    this.contacts = [];
    //   [{
    //   name: undefined,
    //   email: undefined,
    //   tel: undefined,
    //   type: 'Kereskedő'
    // }];
    this.signRisk = undefined;
    this.fulfillRisk = undefined;
    this.comment = undefined;
    this.approved = true;
    this.shortName = null;
    this.producerId =null;
    this.birthName = null;
    this.gender = null;
    this.postAddress =null;
    //this.newAddress = null;
    this.postalAddressIsSame = true;
    this.status = [
      {name:'Vevő',isIn:false},
      {name:'Szállító',isIn:false},
      {name:'Bank',isIn:false},
      {name:'Bróker',isIn:false},
      {name:'Üzletkötő',isIn:false},
      {name:'Alvállalkozó',isIn:false}
    ];
    this.invoiceEmail = undefined;
    this.felir = undefined
  }
};
