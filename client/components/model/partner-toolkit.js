'use strict';
/**
 * The template type to render.
 */
ngivr.model.partnerToolkit = class {

  /**
   * It is either empty, or if it is a an object.
   * @param {object} data
   */
  constructor(data) {

    this.partner = null;
    this.partnerId = undefined;
    this.partnerName = undefined;
    this.tools = [
      {
        partnerToolId: null,
        toolType: null,
        count: null
      }
    ]

    if (data != undefined) {
      Object.assign(this, data);
    }
  }


};
