'use strict';
ngivr.model.deliveryCertificate = class {
  constructor(options) {
    this.items = [];
    this.summaryPerContract = [];
    this.summaryPerItemList = [];
    this.comments = [undefined];
    this.itemized = true;
    this.compensationPercent = 12 ;
    this.type = 'normal';
    this.tickets = [];
    this.pdfUrl = null;
    this.createdBy = {fullName: options.createdBy.fullName, id: options.createdBy._id};
    this.payMode = 'transfer'
  }
};
