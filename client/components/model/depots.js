'use strict';
/**
 * The template type to render.
 */
ngivr.model.depots = class {

  /**
   * It is either empty, or if it is a an object.
   * @param {object} data
   */
  constructor(data) {

    this.createdAt = undefined;
    this.name = undefined;
    this.own = undefined;
    this.possessionTransfers = [];
    this.reserveComments = [];
    this.site = [undefined];
    this.storage = [];
    this.updatedAt = undefined;
    this.visible = true;

    if (data != undefined) {
      Object.assign(this, data);
    }
  }


}
;
