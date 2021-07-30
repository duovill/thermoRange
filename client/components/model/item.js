'use strict';
/**
 * The template type to render.
 */
ngivr.model.item = class {

  /**
   * It is either empty, or if it is a an object.
   * @param {object} data
   */
  constructor() {

    this.product = undefined;
    this.amount = undefined;
    this.totalPrice = undefined;
    this.vat = undefined;
    this.pricePerUnit = undefined;
    this.unit = undefined
  }


}
;
