'use strict';
/**
 * The template type to render.
 */
ngivr.model.serviceContract = class {

  /**
   * It is either empty, or if it is a an object.
   * @param {object} data
   */
  constructor(data) {

    this.currency = 'HUF';
    this.history = [];
    this.isGeneral = true;
    this.depotLoading = undefined;
    this.shipLoading = undefined;
    this.shipUnloading = undefined;
    this.name = undefined;
    this.bagFilling = undefined;
    this.partner = [null];
    this.storageFees = [{base: 'heti', nature: 'Gabona'}];
    this.truckLoading = undefined;

    if (data != undefined) {
      Object.assign(this, data);
    }
  }


}
;












