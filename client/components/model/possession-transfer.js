'use strict';
/**
 * The template type to render.
 */
ngivr.model.possessionTransfer = class {

    /**
     * It is either empty, or if it is a an object.
     * @param options
     */
    constructor(options) {
      let sustainability;
      switch (options.contract.sustainability) {
        case 'ISCC':
          sustainability = 'iscc';
          break;
        case 'BÜHG':
          sustainability = 'buhg';
          break;
        case 'Nem fenntartható':
          sustainability = 'no'
      }

      this.byId = options.user._id;
      this.by = options.user.fullName;
      this.fulfillmentDate = undefined;
      this.productName = options.contract.product[0].name;
      this.productId = options.contract.product[0]._id;
      this.sustainability = sustainability;
      this.ticketType = 'possessionTransfer';
      this.ledger = [
        {
          contractId: options.contract._id,

        }
      ];
      this.direction = options.contract.buy ? 'in' : 'out';
      this.comments = [];
      this.fulfillmentDate = undefined;
      //this.ownerId = options.ownFirm._id;
      //this.ownerName = options.ownFirm.name;
      this.sygnus = true;
      this.possessionTransfer = {
        currency: undefined,
        dueDate: undefined,
        fee: undefined,
        feeStartDate: undefined,
        feeType: null
      };

        this.depot = undefined;
        this.volume = undefined;

        this.feeStartDate = undefined;
        this.fee = undefined;
        this.currency = 'HUF';
        this.feetype = '';

        this.storedPrice = options.storedPrice;

    }


}
;












