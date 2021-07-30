'use strict';
ngivr.model.incomingInvoice = class {
  constructor(options) {
    // this.f = async () => {
    //   this.incomingPayMode = await options.payMode();
    // };
    // this.f();
    this.incomingSeller = [null];
    this.items = [];
    this.goodsSent = undefined;
    this.lastDayOfPayment = undefined;
    this.currency = 'HUF';
    this.history = [];
    this.comments = [undefined];
    this.type = 'normal';
    this.relatedInvoiceNumber = undefined;
    this.correctionComment = undefined;
    this.registryStatus = undefined;
    this.status = undefined;
    this.incomingModeOfArrival = 'postal';
    this.incomingBankAccountNumber = undefined;
    this.swiftCode = undefined;
    this.incomingBrutto = undefined;
    this.incomingNetto = undefined;
    this.incomingVAT = undefined;
    this.incomingKATA = false;
    this.incomingCashAccounting = false;
    this.deadlineDate = undefined;
    this.paymentDate = undefined;
    this.fulfillmentDate = undefined;
    this.incomingDate = undefined;
    this.dateOfInvoice = undefined;
    this.createdBy = options.createdBy;
    this.incomingPayMode = options.payMode;
    this.incoming = true;
    this.hu = true;
    this.rateData = {}
  }
};








