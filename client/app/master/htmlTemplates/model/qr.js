'use strict';
/**
 * The current QR entity.
 */
ngivr.api.htmlTemplate.model.qr = class {

  /**
   * create a QR alignment and name.
   * @param name The name
   * @param top If it is top.
   */
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
};
