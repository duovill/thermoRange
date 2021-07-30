'use strict';
/**
 * The current QR chip info.
 */
ngivr.api.htmlTemplate.controller.qr = class {

  constructor() {
    const qr = ngivr.api.htmlTemplate.model.qr;

    this.alignments = ngivr.strings.htmlTemplate.enum.qrAlignment.map((element) => {
      return new qr(element.message, element.value);
    });
  }

  /**
   * Transforms a chip object to a variable/string/path.
   * @param $chip
   */
  chipTransform($chip) {
    return $chip.path;
  }

};
