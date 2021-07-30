'use strict';
ngivr.model.generalOutgoingInvoice = class {
    constructor(options) {
        this.f = async () => {
            this.payMode = await options.payMode();
        };
        this.f();
        this.type = 'general';
        this.buyer = [undefined];
        this.vatNumber = undefined;
        this.subType = 'other';
        this.deadlineDate = undefined;
        this.fulfillmentDate = undefined;
        this.paymentDate = undefined;
        this.swiftCode = undefined;
        this.accountNumber = undefined;
        this.items = [];
        this.createdBy = options.createdBy;
        this.currency = 'HUF';
        this.created = new Date();
        this.comments = [''];
        this.appearance = 'PAPER'
    }
};
