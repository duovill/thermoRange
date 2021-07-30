'use strict';
ngivr.model.outgoingInvoice = class {
  constructor(options) {
    this.items = [];
    this.summaryPerProduct = [];
    this.summaryPerItemsList = [];
    this.itemized = false;
    this.comments = [''];
    this.vatNumber = {};
    this.continuedFulfillment = false;
    this.createdBy = options.createdBy;
    this.created = new Date();
    //this.payMode = 'transfer';
    this.appearance = 'PAPER'
  }
};
