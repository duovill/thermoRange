'use strict';
/**
 * The template type to render.
 */
ngivr.model.htmlTemplate = class {

  /**
   * It is either empty, or if it is a an object.
   * @param {object} data
   */
  constructor(data) {

    this._id = undefined;
    this.name = undefined;
    this.html = undefined;
    this.mainSchema = undefined;
    this.partialName = undefined;
    this.qrVars = [];
    this.qrAlignment = undefined;
    this.shown = true;

    this.orientation = ngivr.strings.htmlTemplate.default.orientation;
    this.format = ngivr.strings.htmlTemplate.default.format;

    this.copies = 1;
    this.fixedWidth = 0;
    this.fixedHeight = 0;
    this.enableInstanceCounter = true;

    if (data != undefined) {
      Object.assign(this, data);
    }
  }


}
;
